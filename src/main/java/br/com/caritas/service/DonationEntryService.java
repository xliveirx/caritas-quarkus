package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.DonationEntryRequestDTO;
import br.com.caritas.dto.donation.DonationEntryResponseDTO;
import br.com.caritas.dto.donation.DonationEntrySummaryDTO;
import br.com.caritas.entity.donation.*;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.UnitConverter;
import java.math.BigDecimal;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDateTime;

@ApplicationScoped
public class DonationEntryService {

    public ApiListDTO getAllDonationEntries(int page, int size, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        PanacheQuery<DonationEntryEntity> query;

        if(groups.contains(Roles.ADMIN.name())) {

            query = DonationEntryEntity.findAll(Sort.by("date").descending())
                    .page(Page.of(page, size));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            query = DonationEntryEntity.find("parish.id = ?1", parishId)
                    .page(Page.of(page, size));
        }

        var donations = query.list()
                .stream()
                .map(DonationEntrySummaryDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                donations,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public DonationEntryResponseDTO getDonationEntryById(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        DonationEntryEntity donation = DonationEntryEntity.<DonationEntryEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found.",
                        "Donation not found with id " + id
                ));

        if(!groups.contains(Roles.ADMIN.name())) {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            if(!donation.parish.id.equals(parishId)) {
                throw new BusinessRuleException(
                        "You are not allowed to do that.",
                        "You can only search for donations from your own parish."
                );
            }
        }

        return DonationEntryResponseDTO.fromEntity(donation);
    }

    @Transactional
    public DonationEntrySummaryDTO createDonationEntry(DonationEntryRequestDTO req, JsonWebToken jwt) {

        DonationEntryEntity donation = new DonationEntryEntity();

        donation.donator = req.donator();
        donation.observation = req.observation();
        donation.date = LocalDateTime.now();
        donation.status = Status.CONFIRMED;

        var groups = jwt.getGroups();
        Long parishId;

        if(groups.contains(Roles.ADMIN.name())) {
            if (req.parishId() == null) {
                throw new BusinessRuleException(
                        "Parish required.",
                        "Admin must provide a parishId to register a donation entry.");
            }
            parishId = req.parishId();
        } else {
            parishId = Long.valueOf(jwt.getClaim("parish").toString());
        }

        donation.parish = ParishEntity.<ParishEntity>findByIdOptional(parishId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish not found with id " + parishId
                ));

        donation.persist();

        req.batches().forEach(batch -> {

            ProductEntity product = ProductEntity.<ProductEntity>find(
                    "id = ?1 and active = ?2", batch.productId(), Boolean.TRUE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found.",
                            "Product not found with id " + batch.productId()
                    ));

            EntryBatchEntity entry =  new EntryBatchEntity();
            entry.unit = batch.unit();
            entry.quantity = batch.quantity();
            entry.product = product;
            entry.donationEntry = donation;
            entry.persist();

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                    "product.id =?1 and parish.id = ?2", batch.productId(), donation.parish.id)
                    .firstResultOptional()
                    .orElseGet(() -> {
                        StockItemEntity newStockItem = new StockItemEntity();
                        newStockItem.availableQuantity = BigDecimal.ZERO;
                        newStockItem.product = product;
                        newStockItem.parish = donation.parish;
                        return newStockItem;
                    });

            BigDecimal converted = UnitConverter.convert(BigDecimal.valueOf(batch.quantity()), batch.unit(), product.defaultUnit);
            stockItem.availableQuantity = stockItem.availableQuantity.add(converted);
            stockItem.persist();
        });

        return DonationEntrySummaryDTO.fromEntity(donation);
    }

    @Transactional
    public void cancelDonationEntry(Long id) {

        DonationEntryEntity donation = DonationEntryEntity.<DonationEntryEntity>find(
                "id = ?1 and status = ?2", id, Status.CONFIRMED)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found.",
                        "Donation not found with id " + id
                ));


        donation.batches.forEach(batch -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                    "product.id", batch.product.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with id " + batch.product.id
                    ));

            BigDecimal converted = UnitConverter.convert(BigDecimal.valueOf(batch.quantity), batch.unit, batch.product.defaultUnit);
            stockItem.availableQuantity = stockItem.availableQuantity.subtract(converted);
            stockItem.persist();
        });

        donation.status = Status.CANCELED;
        donation.persist();
    }
}
