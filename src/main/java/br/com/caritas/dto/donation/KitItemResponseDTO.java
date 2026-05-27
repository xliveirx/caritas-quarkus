package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.ClothesProductEntity;
import br.com.caritas.entity.donation.FoodProductEntity;
import br.com.caritas.entity.donation.KitItemEntity;
import br.com.caritas.entity.donation.Unit;

import java.math.BigDecimal;

public record KitItemResponseDTO(
        Long id,
        BigDecimal quantity,
        ProductDetailResponseDTO product
) {

    public static KitItemResponseDTO fromEntity(KitItemEntity entity) {
        ProductDetailResponseDTO detail = switch(entity.product) {
            case ClothesProductEntity c -> ProductDetailResponseDTO.Clothes.fromEntity(c);
            case FoodProductEntity f -> ProductDetailResponseDTO.Food.fromEntity(f);
            default -> throw new IllegalStateException();
        };

        return new KitItemResponseDTO(
                entity.id,
                entity.quantity,
                detail
        );
    }
}
