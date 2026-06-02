package br.com.caritas.dto.donation;

import br.com.caritas.dto.family.FamilyResponseDTO;
import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.DonationExitEntity;
import br.com.caritas.entity.donation.DonationStatus;

import java.time.LocalDateTime;
import java.util.List;

public record DonationExitResponseDTO(
        Long id,
        LocalDateTime date,
        String observation,
        ParishResponseDTO parish,
        DonationStatus status,
        FamilyResponseDTO family,
        List<ExitBatchResponseDTO> batches,
        KitResponseDTO kit
) {
    public static DonationExitResponseDTO fromEntity(DonationExitEntity entity) {
        return new DonationExitResponseDTO(
                entity.id,
                entity.date,
                entity.observation,
                ParishResponseDTO.fromEntity(entity.parish),
                entity.status,
                FamilyResponseDTO.fromEntity(entity.family),
                entity.batches.stream()
                        .map(ExitBatchResponseDTO::fromEntity)
                        .toList(),
                KitResponseDTO.fromEntity(entity.kit)
        );
    }
}
