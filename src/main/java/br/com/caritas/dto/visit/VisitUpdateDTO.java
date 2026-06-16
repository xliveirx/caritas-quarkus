package br.com.caritas.dto.visit;

import jakarta.validation.constraints.Future;

import java.time.LocalDateTime;

public record VisitUpdateDTO(
        @Future(message = "You can't schedule a visit in the past")
        LocalDateTime scheduledDate,
        String reason,
        Long userId
) {
}
