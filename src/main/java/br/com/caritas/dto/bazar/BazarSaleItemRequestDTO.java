package br.com.caritas.dto.bazar;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BazarSaleItemRequestDTO(
        @NotNull Long stockItemId,
        @NotNull Integer quantity,
        @NotNull BigDecimal unitPrice
) {
}
