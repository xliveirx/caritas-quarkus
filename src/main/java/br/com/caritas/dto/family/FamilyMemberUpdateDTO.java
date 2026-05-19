package br.com.caritas.dto.family;

import java.time.LocalDate;

public record FamilyMemberUpdateDTO(
        Long id,
        String name,
        String cpf,
        LocalDate birthDate,
        String motherName,
        Boolean responsible
) {
}
