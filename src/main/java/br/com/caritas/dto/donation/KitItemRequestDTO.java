package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Unit;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record KitItemRequestDTO(
        @NotNull BigDecimal quantity,
        @NotNull Long productId
) {
}
