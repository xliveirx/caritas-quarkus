package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.ClothesProductEntity;
import br.com.caritas.entity.donation.ExitBatchEntity;
import br.com.caritas.entity.donation.FoodProductEntity;

import java.math.BigDecimal;

public record ExitBatchResponseDTO(
        Long id,
        BigDecimal quantity,
        ProductDetailResponseDTO product
) {

    public static ExitBatchResponseDTO fromEntity(ExitBatchEntity entity) {
        ProductDetailResponseDTO detail = switch(entity.stockItem.product) {
            case ClothesProductEntity c -> ProductDetailResponseDTO.Clothes.fromEntity(c);
            case FoodProductEntity f -> ProductDetailResponseDTO.Food.fromEntity(f);
            default -> throw new IllegalStateException();
        };

        return new ExitBatchResponseDTO(
                entity.id,
                entity.quantity,
                detail
        );
    }
}
