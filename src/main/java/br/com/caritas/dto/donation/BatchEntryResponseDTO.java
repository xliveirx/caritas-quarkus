package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.EntryBatchEntity;
import br.com.caritas.entity.donation.Unit;

public record BatchEntryResponseDTO(
        Long id,
        Unit unit,
        Integer quantity,
        ProductResponseDTO product
) {

    public static BatchEntryResponseDTO fromEntity(EntryBatchEntity entity) {
        return new BatchEntryResponseDTO(
                entity.id,
                entity.unit,
                entity.quantity,
                ProductResponseDTO.fromEntity(entity.product)
        );
    }
}
