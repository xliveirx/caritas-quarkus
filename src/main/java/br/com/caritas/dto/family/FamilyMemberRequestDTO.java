package br.com.caritas.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FamilyMemberRequestDTO(
        @NotBlank String name,
        String cpf,
        LocalDate birthDate,
        String motherName,
        @NotNull Boolean responsible
) {
}
