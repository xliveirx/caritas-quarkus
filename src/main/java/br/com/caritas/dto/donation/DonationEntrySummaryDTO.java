package br.com.caritas.dto.donation;

import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.entity.donation.DonationEntryEntity;
import br.com.caritas.entity.donation.Status;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DonationEntrySummaryDTO(
        Long id,
        LocalDateTime date,
        String donator,
        String observation,
        Status status,
        ParishResponseDTO parish
) {

    public static DonationEntrySummaryDTO fromEntity (DonationEntryEntity entity){
        return new DonationEntrySummaryDTO(
                entity.id,
                entity.date,
                entity.donator,
                entity.observation,
                entity.status,
                ParishResponseDTO.fromEntity(entity.parish)
        );
    }
}
