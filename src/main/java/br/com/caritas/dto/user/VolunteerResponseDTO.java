package br.com.caritas.dto.user;

import br.com.caritas.entity.user.VolunteerEntity;

import java.time.LocalDateTime;

public record VolunteerResponseDTO(
        Long id,
        String name,
        String email,
        Long parishId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean active,
        boolean hasPassword
) {
    public static VolunteerResponseDTO fromEntity(VolunteerEntity entity) {
        return new VolunteerResponseDTO(
                entity.id,
                entity.name,
                entity.email,
                entity.parish.id,
                entity.createdAt,
                entity.updatedAt,
                entity.active,
                entity.password != null);
    }
}
