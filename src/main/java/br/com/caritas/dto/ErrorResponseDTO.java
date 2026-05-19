package br.com.caritas.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponseDTO (
        String title,
        String message,
        int status,
        LocalDateTime timestamp,
        List<ViolationDTO> errors) {
}
