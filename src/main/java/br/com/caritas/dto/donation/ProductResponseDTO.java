package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.*;

import java.time.LocalDate;

public record ProductResponseDTO(
        Long id,
        String name,
        String description,
        Boolean active,
        ProductType type
) {

    public static ProductResponseDTO fromEntity(ProductEntity entity) {
        return new ProductResponseDTO(
                entity.id, entity.name, entity.description, entity.active, entity.type);
    }
}
