package br.com.caritas.service;

import br.com.caritas.dao.KitDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.KitRequestDTO;
import br.com.caritas.dto.donation.KitResponseDTO;
import br.com.caritas.entity.donation.KitEntity;
import br.com.caritas.entity.donation.KitItemEntity;
import br.com.caritas.entity.donation.ProductEntity;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Set;

@ApplicationScoped
public class KitService {

    @Inject
    private KitDAO kitDAO;

    @Transactional
    public ApiListDTO getAllKits(int page, int size, String search, Boolean active, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        Long parishId = groups.contains(Roles.ADMIN.name()) ? null
                : Long.valueOf(jwt.getClaim("parish").toString());

        var query = kitDAO.findAll(page, size, parishId, search, active);

        var kits = query.list()
                .stream()
                .map(KitResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(kits,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }

    @Transactional
    public KitResponseDTO createKit(KitRequestDTO req, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        KitEntity kit = new KitEntity();
        kit.name = req.name();
        kit.description = req.description();
        kit.active = Boolean.TRUE;

        ParishEntity parish;
        if (groups.contains(Roles.ADMIN.name())) {
            parish = ParishEntity.<ParishEntity>find(
                            "id = ?1 and isDiocese = ?2", req.parishId(), Boolean.FALSE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found",
                            "Parish not found with id " + req.parishId()
                    ));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            parish = ParishEntity.<ParishEntity>find(
                            "id = ?1 and isDiocese = ?1", parishId, Boolean.FALSE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found",
                            "Parish not found with id " + req.parishId()
                    ));
        }

        kit.parish = parish;
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
    public void deactivateKit(Long id, JsonWebToken jwt) {

        KitEntity kit = KitEntity.<KitEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kit not found",
                        "Kit not found with id " + id
                ));

        checkSameParish(jwt, jwt.getGroups(), kit);

        kit.active = Boolean.FALSE;
        kit.persist();
    }

    @Transactional
    public void activateKit(Long id, JsonWebToken jwt) {

        KitEntity kit = KitEntity.<KitEntity>find("id = ?1 and active = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kit not found",
                        "Kit not found with id " + id
                ));

        checkSameParish(jwt, jwt.getGroups(), kit);

        kit.active = Boolean.TRUE;
        kit.persist();
    }

    private void checkSameParish(JsonWebToken jwt, Set<String> groups, KitEntity kit) {

        if (groups.contains(Roles.COORDINATOR.name())) {
            Long parish = Long.valueOf(jwt.getClaim("parish").toString());
            if (!kit.parish.id.equals(parish)) {
                throw new BusinessRuleException(
                        "You are not allowed to do that.",
                        "You can only deactivate/activate a kit from your parish.");
            }
        }
    }
}
