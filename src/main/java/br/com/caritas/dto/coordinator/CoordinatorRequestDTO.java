package br.com.caritas.dto.coordinator;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CoordinatorRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotNull Long parishId,
        @NotBlank @Size(min = 6, max = 32) String password,
        @NotBlank @Size(min = 6, max = 32) String confirmPassword) {
}
