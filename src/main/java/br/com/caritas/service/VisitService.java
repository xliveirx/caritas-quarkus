package br.com.caritas.service;

import br.com.caritas.dto.*;
import br.com.caritas.dto.visit.VisitRequestDTO;
import br.com.caritas.dto.visit.VisitResponseDTO;
import br.com.caritas.dto.visit.VisitUpdateDTO;
import br.com.caritas.entity.visit.VisitEntity;
import br.com.caritas.entity.visit.VisitStatus;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class VisitService {

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllVisitsByFamilyId(Long familyId, int page, int size) {

        PanacheQuery<VisitEntity> query;
        if (parishContext.isAdmin()) {
            query = VisitEntity.<VisitEntity>find("family.id = ?1",
                            Sort.by("createdAt").descending(),
                            familyId)
                    .page(Page.of(page, size));
        } else {
            query = VisitEntity.<VisitEntity>find("family.id = ?1 and parish.id = ?2",
                            Sort.by("createdAt").descending(),
                            familyId, parishContext.getParishClaim())
                    .page(Page.of(page, size));
        }

        var visits = query.list()
                .stream()
                .map(VisitResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                visits,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public List<VisitResponseDTO> getAllVisitsForCalendar(int month, int year, Long parishId) {

        LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime end   = LocalDate.of(year, month, 1).plusMonths(1).atStartOfDay().minusNanos(1);

        Long resolvedParishId = parishContext.resolveParishId(parishId);

        List<VisitEntity> visits;
        if (resolvedParishId != null) {
            visits = VisitEntity.<VisitEntity>find(
                    "scheduledDate >= ?1 and scheduledDate <= ?2 and parish.id = ?3",
                    Sort.by("scheduledDate"), start, end, resolvedParishId
            ).list();
        } else {
            visits = VisitEntity.<VisitEntity>find(
                    "scheduledDate >= ?1 and scheduledDate <= ?2",
                    Sort.by("scheduledDate"), start, end
            ).list();
        }

        return visits.stream().map(VisitResponseDTO::fromEntity).toList();
    }

    @Transactional
    public VisitResponseDTO createVisit(VisitRequestDTO req) {

        VisitEntity visit = new VisitEntity();
        visit.scheduledDate = req.scheduledDate();
        visit.status = VisitStatus.SCHEDULED;
        visit.reason = req.reason();
        visit.createdAt = LocalDateTime.now();

        FamilyEntity family = FamilyEntity.<FamilyEntity>findByIdOptional(req.familyId())
                .filter(f -> parishContext.canAccess(f.parish.id))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Família não encontrada.",
                        "Família não encontrada com id " + req.familyId()
                ));

        visit.family = family;
        visit.parish = family.parish;

        UserEntity user = UserEntity.<UserEntity>findByIdOptional(req.userId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado.",
                        "Usuário não encontrado com id " + req.userId()
                ));

        visit.user = user;
        visit.persist();

        return VisitResponseDTO.fromEntity(visit);
    }

    @Transactional
    public VisitResponseDTO updateVisit(Long id, VisitUpdateDTO req) {

        VisitEntity visit = VisitEntity.<VisitEntity>find("id = ?1 and status = ?2", id, VisitStatus.SCHEDULED)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Visita não encontrada.",
                        "Visita não encontrada com id " + id
                ));

        parishContext.requireSameParish(visit.parish.id);

        if (req.scheduledDate() != null) {
            visit.scheduledDate = req.scheduledDate();
        }

        if (req.reason() != null) {
            visit.reason = req.reason();
        }

        if (req.userId() != null) {
            UserEntity user = UserEntity.<UserEntity>find(
                    "id = ?1 and active = ?2", req.userId(), Boolean.TRUE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuário não encontrado.",
                            "Usuário não encontrado com id " + req.userId()
                    ));
            visit.user = user;
        }

        visit.persist();
        return VisitResponseDTO.fromEntity(visit);
    }

    @Transactional
    public VisitResponseDTO changeVisitStatus(Long id, VisitStatus status) {

        VisitEntity visit = VisitEntity.<VisitEntity>find("id = ?1 and status = ?2", id, VisitStatus.SCHEDULED)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Visita não encontrada.",
                        "Visita não encontrada com id " + id
                ));

        parishContext.requireSameParish(visit.parish.id);

        visit.status = status;
        visit.persist();

        return VisitResponseDTO.fromEntity(visit);
    }
}
