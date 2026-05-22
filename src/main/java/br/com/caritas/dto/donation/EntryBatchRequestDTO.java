package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Unit;

public record EntryBatchRequestDTO(
        Unit unit,
        Integer quantity,
        Long productId
) {
}
