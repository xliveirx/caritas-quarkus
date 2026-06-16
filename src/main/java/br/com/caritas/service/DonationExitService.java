package br.com.caritas.service;

import br.com.caritas.dao.DonationExitDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.DonationExitRequestDTO;
import br.com.caritas.dto.donation.DonationExitResponseDTO;
import br.com.caritas.entity.donation.*;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@ApplicationScoped
public class DonationExitService {

    @Inject
    private DonationExitDAO donationExitDAO;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllDonationExits(int page, int size, String search, DonationStatus donationStatus) {

        Long parishId = parishContext.resolveParishId(null);

        var query = donationExitDAO.findAll(page, size, parishId, search, donationStatus);

        var donations = query.list()
                .stream()
                .map(DonationExitResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                donations,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    @Transactional
    public DonationExitResponseDTO createDonationExit(DonationExitRequestDTO req) {

        DonationExitEntity donation = new DonationExitEntity();
        donation.date = LocalDateTime.now();
        donation.observation = req.observation();
        donation.status = DonationStatus.CONFIRMED;
        donation.parish = parishContext.resolveParish(req.parishId());

        FamilyEntity family = FamilyEntity.<FamilyEntity>find(
                "id = ?1 and parish.id = ?2", req.familyId(), donation.parish.id)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Family not found.",
                        "Family not found with id " + req.familyId()));

        KitEntity kit = KitEntity.<KitEntity>find(
                "id = ?1 and active = ?2 and parish.id = ?3", req.kitId(), Boolean.TRUE, donation.parish.id)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kit not found.",
                        "Kit not found with id " + req.kitId()
                ));

        donation.family = family;
        donation.kit = kit;
        donation.persist();

        kit.items.forEach(item -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                    "parish.id = ?1 and product.id = ?2", donation.parish.id, item.product.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with product id " + item.product.id + " and parish id " + donation.parish.id
                    ));

            BigDecimal totalQuantity = item.quantity.multiply(req.quantity());

            if (totalQuantity.compareTo(stockItem.availableQuantity) > 0) {
                throw new BusinessRuleException(
                        "Invalid quantity",
                        "Theres not enough stock items to donate. Requested quantity is " + totalQuantity +
                                " | Available quantity is " + stockItem.availableQuantity
                );
            }

            ExitBatchEntity batch = new ExitBatchEntity();
            batch.quantity = totalQuantity;
            batch.stockItem = stockItem;
            batch.donationExit = donation;
            batch.persist();
            donation.batches.add(batch);

            stockItem.availableQuantity = stockItem.availableQuantity.subtract(totalQuantity);
            stockItem.persist();
        });

        return DonationExitResponseDTO.fromEntity(donation);
    }

    @Transactional
    public void cancelDonationExit(Long id) {

        DonationExitEntity donation = DonationExitEntity.<DonationExitEntity>find(
                "id = ?1 and status = ?2", id, DonationStatus.CONFIRMED)
                .firstResultOptional()
                .filter(d -> parishContext.canAccess(d.parish.id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Donation not found.",
                        "Donation not found with id " + id
                ));

        donation.batches.forEach(batch -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>findByIdOptional(batch.stockItem.id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with id " + batch.stockItem.id
                    ));

            stockItem.availableQuantity = stockItem.availableQuantity.add(batch.quantity);
            stockItem.persist();
        });

        donation.status = DonationStatus.CANCELED;
        donation.persist();
    }
}
