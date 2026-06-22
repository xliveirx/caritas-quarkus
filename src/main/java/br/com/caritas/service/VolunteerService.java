package br.com.caritas.service;

import br.com.caritas.dao.VolunteerDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.user.VolunteerRequestDTO;
import br.com.caritas.dto.user.VolunteerResponseDTO;
import br.com.caritas.dto.user.VolunteerUpdateDTO;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.entity.user.VolunteerEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.UUID;

@ApplicationScoped
public class VolunteerService {

    @Inject
    private EmailService emailService;

    @Inject
    private VolunteerDAO volunteerDAO;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllVolunteersByParishId(int page, int size, Long parishId,
                                                String search, Boolean active) {

        parishContext.requireSameParish(parishId);

        var query = volunteerDAO.findByParish(page, size, parishId, search, active);

        var volunteers = query.list()
                .stream()
                .sorted(Comparator.comparing(v -> v.name))
                .map(VolunteerResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(volunteers,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }

    public VolunteerResponseDTO getVolunteerById(Long id) {

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Volunteer not found.",
                        "Volunteer with id " + id + " not found."
                ));

        parishContext.requireSameParish(volunteer.parish.id);

        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public VolunteerResponseDTO createVolunteer(VolunteerRequestDTO req) {

        UserEntity.<UserEntity>find("email = ?1 and active = ?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .ifPresent(user -> {
                    throw new BusinessRuleException(
                            "E-mail error",
                            "The informed e-mail has already been registered");
                });

        VolunteerEntity volunteer = new VolunteerEntity();
        volunteer.name = req.name();
        volunteer.email = req.email();

        String token = UUID.randomUUID().toString();
        volunteer.resetToken = BcryptUtil.bcryptHash(token);
        volunteer.resetTokenExpiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15);

        volunteer.parish = parishContext.resolveParish(req.parishId());

        volunteer.createdAt = LocalDateTime.now();
        volunteer.updatedAt = LocalDateTime.now();
        volunteer.active = Boolean.FALSE;
        volunteer.persist();

        this.emailService.sendWelcomeEmail(
                volunteer.name,
                volunteer.email,
                token,
                volunteer.parish.name);

        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public VolunteerResponseDTO updateVolunteer(Long id, VolunteerUpdateDTO req) {

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Volunteer not found.",
                        "Volunteer with id " + id + " not found."
                ));

        parishContext.requireSameParish(volunteer.parish.id);

        if (req.name() != null) {
            volunteer.name = req.name();
        }

        volunteer.updatedAt = LocalDateTime.now();
        volunteer.persist();
        return VolunteerResponseDTO.fromEntity(volunteer);
    }

    @Transactional
    public void deactivateVolunteer(long id) {

        var volunteer = VolunteerEntity.<VolunteerEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        parishContext.requireSameParish(volunteer.parish.id);

        volunteer.active = Boolean.FALSE;
        volunteer.updatedAt = LocalDateTime.now();
        volunteer.persist();
    }

    @Transactional
    public void activateVolunteer(long id) {

        var volunteer = VolunteerEntity.<VolunteerEntity>find(
                "id = ?1 and active = ?2 and password is not null", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with id " + id + " not found."));

        parishContext.requireSameParish(volunteer.parish.id);

        volunteer.active = Boolean.TRUE;
        volunteer.updatedAt = LocalDateTime.now();
        volunteer.persist();
    }
}
