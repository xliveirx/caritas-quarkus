package br.com.caritas.dto.donation;

import java.util.List;

public record DonationEntryRequestDTO(
        String donator,
        String observation,
        Long parishId,
        List<EntryBatchRequestDTO> batches
) {
}
