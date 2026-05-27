package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Unit;
import java.math.BigDecimal;

public record EntryBatchRequestDTO(
        Unit unit,
        BigDecimal quantity,
        Long productId
) {
}
