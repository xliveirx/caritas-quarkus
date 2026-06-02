package br.com.caritas.dto.donation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DonationEntryRequestDTO(
        @NotBlank String donator,
        String observation,
        Long parishId,
        @Valid List<EntryBatchRequestDTO> batches
) {
}
