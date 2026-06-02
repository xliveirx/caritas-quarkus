package br.com.caritas.dto.donation;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record DonationExitRequestDTO(
        String observation,
        Long parishId,
        @NotNull Long familyId,
        @NotNull Long kitId,
        @NotNull BigDecimal quantity
) {
}
