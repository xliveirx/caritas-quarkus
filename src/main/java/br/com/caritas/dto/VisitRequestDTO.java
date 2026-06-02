package br.com.caritas.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record VisitRequestDTO(
        @NotNull
        @Future(message = "You can't schedule a visit in the past")
        LocalDateTime scheduledDate,

        @NotBlank
        String reason,

        @NotNull
        Long familyId,

        @NotNull
        Long volunteerId
) {
}
