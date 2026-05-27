package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Unit;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FoodRequestDTO(
        @NotBlank String name,
        String description,
        String batch,
        @NotNull @Future LocalDate expirationDate,
        @NotNull Unit defaultUnit
) {
}
