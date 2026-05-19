package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.volunteer.VolunteerRequestDTO;
import br.com.caritas.dto.volunteer.VolunteerResponseDTO;
import br.com.caritas.dto.volunteer.VolunteerUpdateDTO;
import br.com.caritas.entity.ParishEntity;
import br.com.caritas.entity.Roles;
import br.com.caritas.entity.UserEntity;
import br.com.caritas.entity.VolunteerEntity;
import br.com.caritas.exception.AuthException;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Set;

@ApplicationScoped
public class VolunteerService {

    public ApiListDTO getAllVolunteersByParishId(int page, int size, Long parishId, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        PanacheQuery<VolunteerEntity> query;
        if (groups.contains(Roles.COORDINATOR.name())) {
            Long parish = Long.valueOf(jwt.getClaim("parish").toString());
            query = VolunteerEntity.<VolunteerEntity>find("parish.id = ?1", parish)
                    .page(Page.of(page, size));

        } else if (groups.contains(Roles.ADMIN.name()) && parishId != null) {
            query = VolunteerEntity.<VolunteerEntity>find("parish.id = ?1", parishId)
                    .page(Page.of(page, size));

        } else {
            throw new AuthException(
                    "Auth error.",
                    "You don't have permission to access this resource");
        }

        var volunteers = query.list()
                .stream()
                .map(VolunteerResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(volunteers,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }

    public VolunteerResponseDTO getVolunteerById(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Volunteer not found.",
                        "Volunteer with id " + id + " not found."
                ));

        this.checkSameParish(jwt, groups, volunteer);

        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public VolunteerResponseDTO createVolunteer(VolunteerRequestDTO req, JsonWebToken jwt) {

        UserEntity.<UserEntity>find("email = ?1 and active = ?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .ifPresent(user -> {
                    throw new BusinessRuleException(
                            "E-mail error",
                            "The informed e-mail has already been registered");
                });

        if (!req.password().equals(req.confirmPassword())) {
            throw new BusinessRuleException(
                    "Passwords mismatch",
                    "The passwords informed don't match");
        }

        var groups = jwt.getGroups();

        if (groups.contains(Roles.ADMIN.name()) && req.parishId() == null) {
            throw new BusinessRuleException(
                    "Validation error.",
                    "Admin must inform a parish to the volunteer.");
        }

        VolunteerEntity volunteer = new VolunteerEntity();
        volunteer.name = req.name();
        volunteer.email = req.email();
        volunteer.password = BcryptUtil.bcryptHash(req.password());

        if (groups.contains(Roles.COORDINATOR.name())) {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(parishId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish with id " + parishId + " not found."));
            volunteer.parish = parish;

        } else if (groups.contains(Roles.ADMIN.name())) {
            ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(req.parishId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish with id " + req.parishId() + " not found."));
            volunteer.parish = parish;
        }

        volunteer.active = Boolean.TRUE;
        volunteer.persist();

        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public VolunteerResponseDTO updateVolunteer(Long id, VolunteerUpdateDTO req, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Volunteer not found.",
                        "Volunteer with id " + id + " not found."
                ));

        this.checkSameParish(jwt, groups, volunteer);

        if(req.name() != null) {
            volunteer.name = req.name();
        }

        if(req.password() != null && req.confirmPassword() != null) {
            if(!req.password().equals(req.confirmPassword())) {
                throw new BusinessRuleException(
                        "Passwords mismatch.",
                        "The passwords informed don't match");
            }
            volunteer.password = BcryptUtil.bcryptHash(req.password());
        }
        volunteer.persist();
        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public void deactivateVolunteer(long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        checkSameParish(jwt, groups, volunteer);

        volunteer.active = Boolean.FALSE;
        volunteer.persist();
    }

    @Transactional
    public void activateVolunteer(long id, JsonWebToken jwt) {
        var groups = jwt.getGroups();

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        checkSameParish(jwt, groups, volunteer);

        volunteer.active = Boolean.TRUE;
        volunteer.persist();
    }

    private void checkSameParish(JsonWebToken jwt, Set<String> groups, VolunteerEntity volunteer) {

        if (groups.contains(Roles.COORDINATOR.name())) {
            Long parish = Long.valueOf(jwt.getClaim("parish").toString());
            if (!volunteer.parish.id.equals(parish)) {
                throw new BusinessRuleException(
                        "You are not allowed to do that.",
                        "A coordinator can only edit a volunteer from his own parish.");
            }
        }
    }
}
