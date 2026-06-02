package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Unit;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EntryBatchRequestDTO(
        @NotNull Unit unit,
        @NotNull BigDecimal quantity,
        @NotNull Long productId
) {
}
