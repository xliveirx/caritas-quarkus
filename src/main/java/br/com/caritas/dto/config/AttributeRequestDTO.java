package br.com.caritas.dto.config;

import br.com.caritas.entity.config.AttributeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AttributeRequestDTO(
        @NotNull AttributeType type,
        @NotBlank String label
) {
}
