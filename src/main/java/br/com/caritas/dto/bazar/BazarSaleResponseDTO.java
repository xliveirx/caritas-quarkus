package br.com.caritas.dto.bazar;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.bazar.BazarSaleEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BazarSaleResponseDTO(
        Long id,
        String buyerName,
        String buyerCpf,
        LocalDateTime soldAt,
        BigDecimal total,
        ParishResponseDTO parish,
        List<BazarSaleItemResponseDTO> items
) {
    public static BazarSaleResponseDTO fromEntity(BazarSaleEntity entity) {
        return new BazarSaleResponseDTO(
                entity.id,
                entity.buyerName,
                entity.buyerCpf,
                entity.soldAt,
                entity.total,
                ParishResponseDTO.fromEntity(entity.parish),
                entity.items.stream()
                        .map(BazarSaleItemResponseDTO::fromEntity)
                        .toList()
        );
    }
}
