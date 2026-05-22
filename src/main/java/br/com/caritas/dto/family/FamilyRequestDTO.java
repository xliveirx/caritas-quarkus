package br.com.caritas.dto.family;

import br.com.caritas.dto.AddressRequestDTO;
import br.com.caritas.entity.family.Situation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record FamilyRequestDTO(
        @Valid @NotNull List<FamilyMemberRequestDTO> members,
        @DecimalMin("0.0") BigDecimal monthlyIncome,
        @NotNull Boolean bolsaFamilia,
        @NotNull Situation situation,
        String observation,
        AddressRequestDTO address,
        Long parishId
) {
}
