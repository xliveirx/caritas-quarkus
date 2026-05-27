package br.com.caritas.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VolunteerRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        Long parishId) {
}
