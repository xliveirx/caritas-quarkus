package br.com.caritas.service;

import br.com.caritas.dao.DonationEntryDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.DonationEntryRequestDTO;
import br.com.caritas.dto.donation.DonationEntryResponseDTO;
import br.com.caritas.entity.donation.*;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.UnitConverter;

import java.math.BigDecimal;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDateTime;

@ApplicationScoped
public class DonationEntryService {

    @Inject
    private DonationEntryDAO donationEntryDAO;

    public ApiListDTO getAllDonationEntries(int page, int size, String search, Status status, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        Long parishId = groups.contains(Roles.ADMIN.name()) ? null
                : Long.valueOf(jwt.getClaim("parish").toString());

        var query = donationEntryDAO.findAll(page, size, parishId, search, status);

        var donations = query.list()
                .stream()
                .map(DonationEntryResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                donations,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    @Transactional
    public DonationEntryResponseDTO createDonationEntry(DonationEntryRequestDTO req, JsonWebToken jwt) {

        DonationEntryEntity donation = new DonationEntryEntity();

        donation.donator = req.donator();
        donation.observation = req.observation();
        donation.date = LocalDateTime.now();
        donation.status = Status.CONFIRMED;

        var groups = jwt.getGroups();
        Long parishId;

        if (groups.contains(Roles.ADMIN.name())) {
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

            EntryBatchEntity entry = new EntryBatchEntity();
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

            BigDecimal converted = UnitConverter.convert(batch.quantity(), batch.unit(), product.defaultUnit);
            stockItem.availableQuantity = stockItem.availableQuantity.add(converted);
            stockItem.persist();
        });

        return DonationEntryResponseDTO.fromEntity(donation);
    }

    @Transactional
    public void cancelDonationEntry(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        DonationEntryEntity donation;
        
        if(groups.contains(Roles.ADMIN.name())) {
            donation = DonationEntryEntity.<DonationEntryEntity>find(
                            "id = ?1 and status = ?2", id, Status.CONFIRMED)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Donation not found.",
                            "Donation not found with id " + id
                    ));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());

            donation = DonationEntryEntity.<DonationEntryEntity>find(
                            "id = ?1 and status = ?2 and parish.id = ?3", id, Status.CONFIRMED, parishId)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Donation not found.",
                            "Donation not found with id " + id
                    ));
        }

        donation.batches.forEach(batch -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                            "product.id", batch.product.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with id " + batch.product.id
                    ));

            BigDecimal converted = UnitConverter.convert(batch.quantity, batch.unit, batch.product.defaultUnit);
            stockItem.availableQuantity = stockItem.availableQuantity.subtract(converted);
            stockItem.persist();
        });

        donation.status = Status.CANCELED;
        donation.persist();
    }
}
