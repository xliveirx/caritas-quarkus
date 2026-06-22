package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.user.CoordinatorRequestDTO;
import br.com.caritas.dto.user.CoordinatorResponseDTO;
import br.com.caritas.dto.user.CoordinatorUpdateDTO;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.CoordinatorEntity;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.UUID;


@ApplicationScoped
public class CoordinatorService {

    @Inject
    private EmailService emailService;

    public ApiListDTO getAllCoordinatorsByParish(int page, int size, Long parishId) {

        var query = CoordinatorEntity.<CoordinatorEntity>find(
                "parish.id = ?1 and parish.isDiocese = ?2", parishId, Boolean.FALSE)
                .page(Page.of(page, size));

        var coordinators = query.list()
                .stream()
                .sorted(Comparator.comparing(c -> c.name))
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

        CoordinatorEntity coordinator = new CoordinatorEntity();
        coordinator.name = req.name();
        coordinator.email = req.email();

        String token = UUID.randomUUID().toString();
        coordinator.resetToken = BcryptUtil.bcryptHash(token);
        coordinator.resetTokenExpiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15);

        ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", req.parishId(), Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish not found with id " + req.parishId()));

        coordinator.parish = parish;

        coordinator.active = Boolean.FALSE;
        coordinator.updatedAt = LocalDateTime.now();
        coordinator.createdAt = LocalDateTime.now();
        coordinator.persist();

        this.emailService.sendWelcomeEmail(
                coordinator.name,
                coordinator.email,
                token,
                coordinator.parish.name);

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

        coordinator.updatedAt = LocalDateTime.now();
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
        coordinator.updatedAt = LocalDateTime.now();
        coordinator.persist();
    }

    @Transactional
    public void activateCoordinator(long id){
        var coordinator = CoordinatorEntity.<CoordinatorEntity>find(
                "id = ?1 and active = ?2 and password is not null", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        coordinator.active = Boolean.TRUE;
        coordinator.updatedAt = LocalDateTime.now();
        coordinator.persist();
    }

}
