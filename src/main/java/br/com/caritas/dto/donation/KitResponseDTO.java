package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.KitEntity;
import br.com.caritas.resources.KitResource;

import java.util.List;

public record KitResponseDTO(
        Long id,
        String name,
        String description,
        Boolean active,
        ParishResponseDTO parish,
        List<KitItemResponseDTO> items
) {

    public static KitResponseDTO fromEntity(KitEntity entity) {
        return new KitResponseDTO(
                entity.id,
                entity.name,
                entity.description,
                entity.active,
                ParishResponseDTO.fromEntity(entity.parish),
                entity.items.stream()
                        .map(KitItemResponseDTO::fromEntity)
                        .toList()
        );
    }
}
