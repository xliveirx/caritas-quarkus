package br.com.caritas.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CoordinatorRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotNull Long parishId) {
}
