package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.FoodProductEntity;
import br.com.caritas.entity.donation.StockItemEntity;

import java.math.BigDecimal;

public record FoodStockItemResponseDTO(
        Long id,
        BigDecimal availableQuantity,
        ParishResponseDTO parish,
        FoodResponseDTO food) {

    public static FoodStockItemResponseDTO fromEntity(StockItemEntity entity) {
        return new FoodStockItemResponseDTO(
                entity.id,
                entity.availableQuantity,
                ParishResponseDTO.fromEntity(entity.parish),
                FoodResponseDTO.fromEntity((FoodProductEntity) entity.product)
        );
    }
}
