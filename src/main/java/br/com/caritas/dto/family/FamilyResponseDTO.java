package br.com.caritas.dto.family;

import br.com.caritas.dto.address.AddressResponseDTO;
import br.com.caritas.entity.FamilyEntity;
import br.com.caritas.entity.Situation;

import java.math.BigDecimal;
import java.util.List;

public record FamilyResponseDTO(
        Long id,
        List<FamilyMemberResponseDTO> members,
        BigDecimal monthlyIncome,
        Boolean bolsaFamilia,
        Situation situation,
        String observation,
        AddressResponseDTO address
) {
    public static FamilyResponseDTO fromEntity(FamilyEntity entity) {
        return new FamilyResponseDTO(
                entity.id,
                FamilyMemberResponseDTO.fromEntity(entity.members),
                entity.monthlyIncome,
                entity.bolsaFamilia,
                entity.situation,
                entity.observation,
                entity.address != null ? AddressResponseDTO.fromEntity(entity.address) : null
        );
    }
}
