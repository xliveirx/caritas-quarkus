package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.DonationEntryEntity;
import br.com.caritas.entity.donation.Status;

import java.time.LocalDateTime;
import java.util.List;

public record DonationEntryResponseDTO(
        Long id,
        LocalDateTime date,
        String donator,
        String observation,
        Status status,
        ParishResponseDTO parish,
        List<BatchEntryResponseDTO> batches
) {

    public static DonationEntryResponseDTO fromEntity(DonationEntryEntity entity) {
        return new DonationEntryResponseDTO(
                entity.id,
                entity.date,
                entity.donator,
                entity.observation,
                entity.status,
                ParishResponseDTO.fromEntity(entity.parish),
                entity.batches.stream()
                        .map(BatchEntryResponseDTO::fromEntity)
                        .toList()
        );
    }
}
