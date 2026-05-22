package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.Category;
import br.com.caritas.entity.donation.Condition;
import br.com.caritas.entity.donation.Gender;
import br.com.caritas.entity.donation.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClothesRequestDTO(
        @NotBlank String name,
        String description,
        Size size,
        Category category,
        Gender gender,
        @NotNull Condition condition
) {
}
