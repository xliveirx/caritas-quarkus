package br.com.caritas.dto.address;

import br.com.caritas.entity.Address;

public record AddressResponseDTO(
        String street,
        Integer number,
        String complement,
        String city,
        String state,
        String postalCode
) {
    public static AddressResponseDTO fromEntity(Address entity) {
        return new AddressResponseDTO(
                entity.street,
                entity.number,
                entity.complement,
                entity.city,
                entity.state,
                entity.postalCode
        );
    }
}
