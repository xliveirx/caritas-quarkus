package br.com.caritas.dto.parish;

import br.com.caritas.dto.AddressResponseDTO;
import br.com.caritas.entity.parish.ParishEntity;

import java.time.LocalDateTime;

public record ParishResponseDTO(Long id, String name, AddressResponseDTO address, String cnpj, Boolean isDiocese, LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static ParishResponseDTO fromEntity(ParishEntity entity) {
        return new ParishResponseDTO(
                entity.id,
                entity.name,
                AddressResponseDTO.fromEntity(entity.address),
                entity.cnpj,
                entity.isDiocese,
                entity.createdAt,
                entity.updatedAt
        );
    }
}
