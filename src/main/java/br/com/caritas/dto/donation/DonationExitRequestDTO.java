package br.com.caritas.dto.donation;

import java.math.BigDecimal;

public record DonationExitRequestDTO(
        String observation,
        Long parishId,
        Long familyId,
        Long kitId,
        BigDecimal quantity
) {
}
