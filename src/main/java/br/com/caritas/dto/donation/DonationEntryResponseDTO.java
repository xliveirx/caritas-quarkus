package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.DonationEntryEntity;
import br.com.caritas.entity.donation.DonationStatus;

import java.time.LocalDateTime;
import java.util.List;

public record DonationEntryResponseDTO(
        Long id,
        LocalDateTime date,
        String donator,
        String observation,
        DonationStatus status,
        ParishResponseDTO parish,
        List<EntryBatchResponseDTO> batches
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
                        .map(EntryBatchResponseDTO::fromEntity)
                        .toList()
        );
    }
}
