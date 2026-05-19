package br.com.caritas.dto.family;

import br.com.caritas.entity.FamilyMemberEntity;

import java.time.LocalDate;
import java.util.List;

public record FamilyMemberResponseDTO(
        Long id,
        String name,
        String cpf,
        LocalDate birthDate,
        String motherName,
        Boolean responsible
) {

    public static FamilyMemberResponseDTO fromEntity(FamilyMemberEntity entity) {
        return new FamilyMemberResponseDTO(
                entity.id,
                entity.name,
                entity.cpf,
                entity.birthDate,
                entity.motherName,
                entity.responsible
        );
    }

    public static List<FamilyMemberResponseDTO> fromEntity(List<FamilyMemberEntity> entities) {
        return entities.stream()
                .map(FamilyMemberResponseDTO::fromEntity)
                .toList();
    }
}
