package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.FoodProductEntity;
import br.com.caritas.entity.donation.Unit;

import java.time.LocalDate;

public record FoodResponseDTO(
        Long id,
        String name,
        String batch,
        String description,
        Boolean active,
        LocalDate expirationDate,
        Unit defaultUnit
) {

    public static FoodResponseDTO fromEntity(FoodProductEntity entity) {
        return new FoodResponseDTO(
                entity.id,
                entity.name,
                entity.batch,
                entity.description,
                entity.active,
                entity.expirationDate,
                entity.defaultUnit
        );
    }
}
