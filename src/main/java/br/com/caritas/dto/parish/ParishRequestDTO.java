package br.com.caritas.dto.parish;

import br.com.caritas.dto.AddressRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ParishRequestDTO(
        @NotBlank String name,
        @Valid @NotNull AddressRequestDTO address,
        @NotBlank @Pattern(regexp = "^(\\d{14}|\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})$", message = "Invalid CNPJ format") String cnpj
) {
}
