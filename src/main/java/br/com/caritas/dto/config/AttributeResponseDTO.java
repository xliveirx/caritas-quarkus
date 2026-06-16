package br.com.caritas.dto.config;

import br.com.caritas.entity.config.AttributeEntity;
import br.com.caritas.entity.config.AttributeType;

public record AttributeResponseDTO(
        Long id,
        AttributeType type,
        String label,
        Integer position
) {

    public static AttributeResponseDTO fromEntity(AttributeEntity entity) {
        return new AttributeResponseDTO(
                entity.id,
                entity.type,
                entity.label,
                entity.position
        );
    }
}
