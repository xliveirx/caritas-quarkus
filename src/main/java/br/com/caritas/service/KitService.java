package br.com.caritas.service;

import br.com.caritas.dao.KitDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.KitRequestDTO;
import br.com.caritas.dto.donation.KitResponseDTO;
import br.com.caritas.entity.donation.KitEntity;
import br.com.caritas.entity.donation.KitItemEntity;
import br.com.caritas.entity.donation.ProductEntity;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class KitService {

    @Inject
    private KitDAO kitDAO;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllKits(int page, int size, String search, Boolean active, Long parishId) {

        parishId = parishContext.resolveParishId(parishId);

        var query = kitDAO.findAll(page, size, parishId, search, active);

        var kits = query.list()
                .stream()
                .map(KitResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(kits,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }

    @Transactional
    public KitResponseDTO createKit(KitRequestDTO req) {

        KitEntity kit = new KitEntity();
        kit.name = req.name();
        kit.description = req.description();
        kit.active = Boolean.TRUE;
        kit.parish = parishContext.resolveParish(req.parishId());
        kit.persist();

        req.items().forEach(item -> {
            KitItemEntity kitItem = new KitItemEntity();

            ProductEntity product = ProductEntity.<ProductEntity>find(
                            "id = ?1 and active = ?2", item.productId(), Boolean.TRUE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found",
                            "Product not found with id " + item.productId()
                    ));

            kitItem.product = product;
            kitItem.quantity = item.quantity();
            kitItem.kit = kit;
            kitItem.persist();
            kit.items.add(kitItem);
        });

        return KitResponseDTO.fromEntity(kit);
    }

    @Transactional
    public void deactivateKit(Long id) {

        KitEntity kit = KitEntity.<KitEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kit not found",
                        "Kit not found with id " + id
                ));

        parishContext.requireSameParish(kit.parish.id);

        kit.active = Boolean.FALSE;
        kit.persist();
    }

    @Transactional
    public void activateKit(Long id) {

        KitEntity kit = KitEntity.<KitEntity>find("id = ?1 and active = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kit not found",
                        "Kit not found with id " + id
                ));

        parishContext.requireSameParish(kit.parish.id);

        kit.active = Boolean.TRUE;
        kit.persist();
    }
}
