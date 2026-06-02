package br.com.caritas.dto.family;

import jakarta.validation.constraints.Past;

import java.time.LocalDate;
import java.util.Optional;

public record FamilyMemberUpdateDTO(
        Long id,
        String name,
        String cpf,
        @Past LocalDate birthDate,
        String motherName,
        Boolean responsible
) {
}
