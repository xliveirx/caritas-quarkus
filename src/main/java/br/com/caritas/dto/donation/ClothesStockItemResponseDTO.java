package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.ClothesProductEntity;
import br.com.caritas.entity.donation.StockItemEntity;

import java.math.BigDecimal;

public record ClothesStockItemResponseDTO(
        Long id,
        BigDecimal availableQuantity,
        ParishResponseDTO parish,
        ClothesResponseDTO clothes) {

    public static ClothesStockItemResponseDTO fromEntity(StockItemEntity entity) {
        return new ClothesStockItemResponseDTO(
                entity.id,
                entity.availableQuantity,
                ParishResponseDTO.fromEntity(entity.parish),
                ClothesResponseDTO.fromEntity((ClothesProductEntity) entity.product)
        );
    }
}
