package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.ClothesProductEntity;
import br.com.caritas.entity.donation.EntryBatchEntity;
import br.com.caritas.entity.donation.FoodProductEntity;
import br.com.caritas.entity.donation.Unit;

import java.math.BigDecimal;

public record EntryBatchResponseDTO(
        Long id,
        Unit unit,
        BigDecimal quantity,
        ProductDetailResponseDTO product
) {

    public static EntryBatchResponseDTO fromEntity(EntryBatchEntity entity) {
        ProductDetailResponseDTO detail = switch (entity.product) {
            case ClothesProductEntity c -> ProductDetailResponseDTO.Clothes.fromEntity(c);
            case FoodProductEntity f -> ProductDetailResponseDTO.Food.fromEntity(f);
            default -> throw new IllegalStateException();
        };

        return new EntryBatchResponseDTO(
                entity.id,
                entity.unit,
                entity.quantity,
                detail
        );
    }
}
