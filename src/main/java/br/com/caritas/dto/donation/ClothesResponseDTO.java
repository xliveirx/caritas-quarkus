package br.com.caritas.dto.donation;

import br.com.caritas.dto.config.AttributeResponseDTO;
import br.com.caritas.entity.donation.*;

import java.util.List;

public record ClothesResponseDTO(
        Long id,
        String name,
        String description,
        Boolean active,
        List<AttributeResponseDTO> attributes,
        Unit defaultUnit
) {

    public static ClothesResponseDTO fromEntity(ClothesProductEntity entity) {
        return new ClothesResponseDTO(
                entity.id,
                entity.name,
                entity.description,
                entity.active,
                entity.attributes.stream()
                        .map(AttributeResponseDTO::fromEntity)
                        .toList(),
                entity.defaultUnit
        );
    }
}
