package br.com.caritas.dto.family;

import br.com.caritas.dto.AddressRequestDTO;
import br.com.caritas.entity.family.Situation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public record FamilyUpdateDTO(
        @Valid List<FamilyMemberUpdateDTO> members,
        @DecimalMin("0.0") BigDecimal monthlyIncome,
        Boolean bolsaFamilia,
        Situation situation,
        String observation,
        AddressRequestDTO address
) {
}
