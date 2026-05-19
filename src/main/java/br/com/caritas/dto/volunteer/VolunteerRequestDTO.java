package br.com.caritas.dto.volunteer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VolunteerRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        Long parishId,
        @NotBlank @Size(min = 6, max = 32) String password,
        @NotBlank @Size(min = 6, max = 32) String confirmPassword) {
}
