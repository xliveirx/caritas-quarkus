package br.com.caritas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddressRequestDTO (
         @NotBlank String street,
         @NotNull Integer number,
         String complement,
         @NotBlank String city,
         @NotBlank String state,
         @NotBlank String postalCode
){
}
