package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.coordinator.CoordinatorRequestDTO;
import br.com.caritas.dto.coordinator.CoordinatorResponseDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.coordinator.CoordinatorUpdateDTO;
import br.com.caritas.entity.CoordinatorEntity;
import br.com.caritas.entity.ParishEntity;
import br.com.caritas.entity.UserEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;


@ApplicationScoped
public class CoordinatorService {

    public ApiListDTO getAllCoordinatorsByParish(int page, int size, Long parishId) {

        var query = CoordinatorEntity.<CoordinatorEntity>find("parish.id = ?1", parishId)
                .page(Page.of(page, size));

        var coordinators = query.list()
                .stream()
                .map(CoordinatorResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(coordinators,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }

    public CoordinatorResponseDTO getCoordinatorById(Long id) {

        var coordinator = CoordinatorEntity.<CoordinatorEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Coordinator not found.",
                        "Coordinator not found with id: " + id
                ));

        return CoordinatorResponseDTO.fromEntity(coordinator);
    }

    @Transactional
    public CoordinatorResponseDTO createCoordinator(CoordinatorRequestDTO req) {

        UserEntity.<UserEntity>find("email = ?1 and active = ?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .ifPresent(user -> {
                    throw new BusinessRuleException(
                            "E-mail error.",
                            "E-mail " + req.email() +  " has already been registered");
                });

        if (!req.password().equals(req.confirmPassword())) {
            throw new BusinessRuleException(
                    "Passwords mismatch."
                    ,"The passwords informed don't match");
        }

        CoordinatorEntity coordinator = new CoordinatorEntity();
        coordinator.name = req.name();
        coordinator.email = req.email();
        coordinator.password = BcryptUtil.bcryptHash(req.password());

        ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(req.parishId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish not found with id " + req.parishId()));

        coordinator.parish = parish;

        coordinator.active = Boolean.TRUE;
        coordinator.persist();

        return CoordinatorResponseDTO.fromEntity(coordinator);
    }

    @Transactional
    public CoordinatorResponseDTO updateCoordinator(Long id, CoordinatorUpdateDTO req) {

        CoordinatorEntity coordinator = CoordinatorEntity.<CoordinatorEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        if(req.name() != null) {
            coordinator.name = req.name();
        }

        if(req.password() != null && req.confirmPassword() != null) {
            if(!req.password().equals(req.confirmPassword())) {
                throw new BusinessRuleException(
                        "Passwords mismatch.",
                        "The passwords informed don't match");
            }
            coordinator.password = BcryptUtil.bcryptHash(req.password());
        }

        coordinator.persist();

        return CoordinatorResponseDTO.fromEntity(coordinator);
    }

    @Transactional
    public void deactivateCoordinator(long id){
        var coordinator = CoordinatorEntity.<CoordinatorEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        coordinator.active = Boolean.FALSE;
        coordinator.persist();
    }

    @Transactional
    public void activateCoordinator(long id){
        var coordinator = CoordinatorEntity.<CoordinatorEntity>find("id = ?1 and active = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        coordinator.active = Boolean.TRUE;
        coordinator.persist();
    }

}
