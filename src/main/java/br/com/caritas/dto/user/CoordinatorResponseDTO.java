package br.com.caritas.dto.user;

import br.com.caritas.entity.user.CoordinatorEntity;

import java.time.LocalDateTime;

public record CoordinatorResponseDTO(
        Long id,
        String name,
        String email,
        Long parishId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean active
) {
    public static CoordinatorResponseDTO fromEntity(CoordinatorEntity entity) {
        return new CoordinatorResponseDTO(
                entity.id,
                entity.name,
                entity.email,
                entity.parish.id,
                entity.createdAt,
                entity.updatedAt,
                entity.active);
    }
}
