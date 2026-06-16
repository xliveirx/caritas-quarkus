package br.com.caritas.dto.bazar;

import br.com.caritas.entity.bazar.BazarSaleItemEntity;

import java.math.BigDecimal;

public record BazarSaleItemResponseDTO(
        Long id,
        String productName,
        String productType,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static BazarSaleItemResponseDTO fromEntity(BazarSaleItemEntity entity) {
        return new BazarSaleItemResponseDTO(
                entity.id,
                entity.stockItem.product.name,
                entity.stockItem.product.type != null ? entity.stockItem.product.type.name() : null,
                entity.quantity,
                entity.unitPrice,
                entity.unitPrice.multiply(BigDecimal.valueOf(entity.quantity))
        );
    }
}
