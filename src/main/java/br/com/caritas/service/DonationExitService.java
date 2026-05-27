package br.com.caritas.service;

import br.com.caritas.dao.DonationExitDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.DonationExitRequestDTO;
import br.com.caritas.dto.donation.DonationExitResponseDTO;
import br.com.caritas.entity.donation.*;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.UnitConverter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@ApplicationScoped
public class DonationExitService {

    @Inject
    private DonationExitDAO donationExitDAO;

    @Transactional
    public ApiListDTO getAllDonationExits(int page, int size, String search, Status status, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        Long parishId = groups.contains(Roles.ADMIN.name()) ? null
                : Long.valueOf(jwt.getClaim("parish").toString());

        var query = donationExitDAO.findAll(page, size, parishId, search, status);

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
    public DonationExitResponseDTO createDonationExit(DonationExitRequestDTO req, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        DonationExitEntity donation = new DonationExitEntity();
        donation.date = LocalDateTime.now();
        donation.observation = req.observation();
        donation.status = Status.CONFIRMED;

        ParishEntity parish;
        FamilyEntity family;
        KitEntity kit;
        if (groups.contains(Roles.ADMIN.name())) {

            parish = ParishEntity.<ParishEntity>findByIdOptional(req.parishId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish not found with id " + req.parishId()));

            family = FamilyEntity.<FamilyEntity>findByIdOptional(req.familyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family not found with id " + req.familyId()));

            kit = KitEntity.<KitEntity>find("id = ?1 and active = ?2", req.kitId(), Boolean.TRUE
                    ).firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Kit not found.",
                            "Kit not found with id " + req.kitId()
                    ));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            parish = ParishEntity.<ParishEntity>findByIdOptional(parishId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish not found with id " + parishId));

            family = FamilyEntity.<FamilyEntity>find("id = ?1 and parish.id = ?2", req.familyId(), parish.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family not found with id " + req.familyId() + " and parish id " + parish.id
                    ));

            kit = KitEntity.<KitEntity>find(
                            "id = ?1 and active = ?2 and parish.id = ?3", req.kitId(), Boolean.TRUE, parish.id
                    ).firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Kit not found.",
                            "Kit not found with id " + req.kitId()
                    ));
        }

        donation.parish = parish;
        donation.family = family;
        donation.kit = kit;
        donation.persist();

        kit.items.forEach(item -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find("parish.id = ?1 and product.id = ?2",
                    parish.id, item.product.id).firstResultOptional().orElseThrow(() -> new ResourceNotFoundException(
                    "Stock item not found.",
                    "Stock item not found with product id " + item.product.id + " and parish id " + parish.id
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
    public void cancelDonationExit(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        DonationExitEntity donation;

        if(groups.contains(Roles.ADMIN.name())) {

            donation = DonationExitEntity.<DonationExitEntity>find("id = ?1 and status = ?2", id, Status.CONFIRMED)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Donation not found.",
                            "Donation not found with id " + id
                    ));
        } else {

            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            donation = DonationExitEntity.<DonationExitEntity>find(
                    "id = ?1 and status = ?2 and parish.id = ?3", id, Status.CONFIRMED, parishId)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Donation not found.",
                            "Donation not found with id " + id
                    ));
        }

        donation.batches.forEach(batch -> {

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>findByIdOptional(batch.stockItem.id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found.",
                            "Stock item not found with id " + batch.stockItem.id
                    ));

            stockItem.availableQuantity = stockItem.availableQuantity.add(batch.quantity);
            stockItem.persist();
        });

        donation.status = Status.CANCELED;
        donation.persist();
    }
}