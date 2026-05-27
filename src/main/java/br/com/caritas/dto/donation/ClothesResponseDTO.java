package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.*;

public record ClothesResponseDTO(
        Long id,
        String name,
        String description,
        Boolean active,
        Size size,
        Category category,
        Gender gender,
        Condition condition,
        Unit defaultUnit
) {

    public static ClothesResponseDTO fromEntity(ClothesProductEntity entity) {
        return new ClothesResponseDTO(
                entity.id,
                entity.name,
                entity.description,
                entity.active,
                entity.size,
                entity.category,
                entity.gender,
                entity.condition,
                entity.defaultUnit
        );
    }
}
