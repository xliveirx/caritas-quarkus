package br.com.caritas.dto.family;

import br.com.caritas.dto.AddressResponseDTO;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.family.Situation;

import java.math.BigDecimal;
import java.util.List;

public record FamilyResponseDTO(
        Long id,
        List<FamilyMemberResponseDTO> members,
        Long parishId,
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
                entity.parish.id,
                entity.monthlyIncome,
                entity.bolsaFamilia,
                entity.situation,
                entity.observation,
                entity.address != null ? AddressResponseDTO.fromEntity(entity.address) : null
        );
    }
}
