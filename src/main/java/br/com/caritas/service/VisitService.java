package br.com.caritas.service;

import br.com.caritas.dto.*;
import br.com.caritas.entity.VisitEntity;
import br.com.caritas.entity.VisitStatus;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.entity.user.VolunteerEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDateTime;

@ApplicationScoped
public class VisitService {

    public ApiListDTO getAllVisitsByFamilyId(Long familyId, int page, int size, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        PanacheQuery<VisitEntity> query;
        if(groups.contains(Roles.ADMIN.name())) {

             query = VisitEntity.<VisitEntity>find("family.id = ?1",
                             Sort.by("createdAt").descending(),
                             familyId)
                     .page(Page.of(page, size));
        } else {

            Long parishId = jwt.getClaim("parish");
            query = VisitEntity.<VisitEntity>find("family.id = ?1 and parish.id = ?2",
                            Sort.by("createdAt").descending(),
                            familyId, parishId)
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

    @Transactional
    public VisitResponseDTO createVisit(VisitRequestDTO req, JsonWebToken jwt) {

        VisitEntity visit = new VisitEntity();

        visit.scheduledDate = req.scheduledDate();
        visit.status = VisitStatus.SCHEDULED;
        visit.reason = req.reason();
        visit.createdAt = LocalDateTime.now();

        var groups = jwt.getGroups();
        FamilyEntity family;

        if(groups.contains(Roles.ADMIN.name())) {
            family = FamilyEntity.<FamilyEntity>findByIdOptional(req.familyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family not found with id: " + req.familyId()
                    ));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            family = FamilyEntity.<FamilyEntity>find("id = ?1 and parish.id = ?2", req.familyId(), parishId)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family not found with id: " + req.familyId()
                    ));
        }

        visit.family = family;
        visit.parish = family.parish;

        VolunteerEntity volunteer = VolunteerEntity.<VolunteerEntity>findByIdOptional(req.volunteerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Volunteer not found.",
                        "Volunteer not found with id: " + req.volunteerId()
                ));

        visit.volunteer  = volunteer;
        visit.persist();

        return VisitResponseDTO.fromEntity(visit);
    }

    @Transactional
    public VisitResponseDTO updateVisit(Long id, VisitUpdateDTO req, JsonWebToken jwt) {

        VisitEntity visit = VisitEntity.<VisitEntity>find("id = ?1 and status = ?2", id, VisitStatus.SCHEDULED)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Visit not found.",
                        "Visit not found with id: " + id
                ));

        var groups = jwt.getGroups();
        if(!groups.contains(Roles.ADMIN.name())) {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            if(!visit.parish.id.equals(parishId)) {
                throw new BusinessRuleException(
                        "You cannot do that.",
                        "You can only conclude a visit from your parish."
                );
            }
        }

        if(req.scheduledDate() != null) {
            visit.scheduledDate = req.scheduledDate();
        }

        if(req.reason() != null) {
            visit.reason = req.reason();
        }

        if(req.volunteerId() != null) {
            VolunteerEntity volunteer = VolunteerEntity.<VolunteerEntity>find(
                    "id = ?1 and active = ?2", req.volunteerId(), Boolean.TRUE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Volunteer not found.",
                            "Volunteer not found with id: " + req.volunteerId()
                    ));
            visit.volunteer  = volunteer;
        }

        visit.persist();
        return VisitResponseDTO.fromEntity(visit);
    }

    @Transactional
    public VisitResponseDTO changeVisitStatus(Long id, JsonWebToken jwt, VisitStatus status) {

        VisitEntity visit = VisitEntity.<VisitEntity>find("id = ?1 and status = ?2", id, VisitStatus.SCHEDULED)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Visit not found.",
                        "Visit not found with id: " + id
                ));

        var groups = jwt.getGroups();
        if(!groups.contains(Roles.ADMIN.name())) {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            if(!visit.parish.id.equals(parishId)) {
                throw new BusinessRuleException(
                        "You cannot do that.",
                        "You can only conclude a visit from your parish."
                );
            }
        }

        visit.status = status;
        visit.persist();

        return VisitResponseDTO.fromEntity(visit);
    }
}
