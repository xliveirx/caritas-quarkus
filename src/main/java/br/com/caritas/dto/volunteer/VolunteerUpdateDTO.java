package br.com.caritas.dto.volunteer;

import jakarta.validation.constraints.Size;

public record VolunteerUpdateDTO(String name,
                                 @Size(min = 6, max = 32) String password,
                                 @Size(min = 6, max = 32) String confirmPassword) {
}
