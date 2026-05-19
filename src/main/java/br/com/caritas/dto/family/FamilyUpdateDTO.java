package br.com.caritas.dto.family;

import br.com.caritas.dto.address.AddressRequestDTO;
import br.com.caritas.entity.Situation;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public record FamilyUpdateDTO(
        List<FamilyMemberUpdateDTO> members,
        @DecimalMin("0.0") BigDecimal monthlyIncome,
        Boolean bolsaFamilia,
        Situation situation,
        String observation,
        AddressRequestDTO address
) {
}
