package br.com.caritas.dto.config;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReorderAttributesDTO(
        @NotNull List<Long> ids
) {
}
