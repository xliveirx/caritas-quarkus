package br.com.caritas.dto.parish;

import br.com.caritas.dto.address.AddressRequestDTO;
import jakarta.validation.constraints.Pattern;

public record ParishUpdateDTO(
        String name,
        AddressRequestDTO address,
        @Pattern(regexp = "^(\\d{14}|\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})$", message = "Invalid CNPJ format") String cnpj
) {
}
