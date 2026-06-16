package br.com.caritas.service;

import br.com.caritas.dao.DonationEntryDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.DonationEntryRequestDTO;
import br.com.caritas.dto.donation.DonationEntryResponseDTO;
import br.com.caritas.entity.donation.*;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import br.com.caritas.util.UnitConverter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@ApplicationScoped
public class DonationEntryService {

    @Inject
    private DonationEntryDAO donationEntryDAO;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllDonationEntries(int page, int size, String search, DonationStatus donationStatus) {

        Long parishId = parishContext.resolveParishId(null);

        var query = donationEntryDAO.findAll(page, size, parishId, search, donationStatus);

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
    public DonationEntryResponseDTO createDonationEntry(DonationEntryRequestDTO req) {

        DonationEntryEntity donation = new DonationEntryEntity();
        donation.donator = req.donator();
        donation.observation = req.observation();
        donation.date = LocalDateTime.now();
        donation.status = DonationStatus.CONFIRMED;
        donation.parish = parishContext.resolveParish(req.parishId());
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
            donation.batches.add(entry);
            entry.persist();

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                            "product.id = ?1 and parish.id = ?2", batch.productId(), donation.parish.id)
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
    public void cancelDonationEntry(Long id) {

        DonationEntryEntity donation = DonationEntryEntity.<DonationEntryEntity>find(
                        "id = ?1 and status = ?2", id, DonationStatus.CONFIRMED)
                .firstResultOptional()
                .filter(d -> parishContext.canAccess(d.parish.id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found.",
                        "Donation not found with id " + id
                ));

        donation.batches.forEach(batch -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                            "product.id = ?1 and parish.id = ?2", batch.product.id, donation.parish.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with id " + batch.product.id
                    ));

            BigDecimal converted = UnitConverter.convert(batch.quantity, batch.unit, batch.product.defaultUnit);

            if(stockItem.availableQuantity.subtract(converted).compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException(
                        "Falha ao cancelar.",
                        "O estoque do produto '" + stockItem.product.name + "' não pode ser negativo."
                );
            }

            stockItem.availableQuantity = stockItem.availableQuantity.subtract(converted);
            stockItem.persist();
        });

        donation.status = DonationStatus.CANCELED;
        donation.persist();
    }
}
