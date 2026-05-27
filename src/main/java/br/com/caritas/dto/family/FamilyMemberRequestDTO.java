package br.com.caritas.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record FamilyMemberRequestDTO(
        @NotBlank String name,
        String cpf,
        @Past LocalDate birthDate,
        String motherName,
        @NotNull Boolean responsible
) {
}
