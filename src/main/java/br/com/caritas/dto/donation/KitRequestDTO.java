package br.com.caritas.dto.donation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record KitRequestDTO(
        @NotBlank String name,
        String description,
        Long parishId,
        @Valid @NotNull List<KitItemRequestDTO> items
) {
}
