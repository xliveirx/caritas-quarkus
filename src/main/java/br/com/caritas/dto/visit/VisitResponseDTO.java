package br.com.caritas.dto.visit;

import br.com.caritas.dto.user.UserResponseDTO;
import br.com.caritas.dto.family.FamilyResponseDTO;
import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.visit.VisitEntity;
import br.com.caritas.entity.visit.VisitStatus;

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
        UserResponseDTO user
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
                UserResponseDTO.fromEntity(entity.user)
        );
    }
}
