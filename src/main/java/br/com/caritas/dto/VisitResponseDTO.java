package br.com.caritas.dto;

import br.com.caritas.dto.family.FamilyResponseDTO;
import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.dto.user.VolunteerResponseDTO;
import br.com.caritas.entity.VisitEntity;
import br.com.caritas.entity.VisitStatus;

import java.time.LocalDateTime;

public record VisitResponseDTO(
        Long id,
        LocalDateTime scheduledDate,
        LocalDateTime completedDate,
        VisitStatus status,
        String reason,
        LocalDateTime createdAt,
        FamilyResponseDTO family,
        ParishResponseDTO parish,
        VolunteerResponseDTO volunteer
) {

    public static VisitResponseDTO fromEntity(VisitEntity entity) {
        return new VisitResponseDTO(
                entity.id,
                entity.scheduledDate,
                entity.completedDate,
                entity.status,
                entity.reason,
                entity.createdAt,
                FamilyResponseDTO.fromEntity(entity.family),
                ParishResponseDTO.fromEntity(entity.parish),
                VolunteerResponseDTO.fromEntity(entity.volunteer)
        );
    }
}
