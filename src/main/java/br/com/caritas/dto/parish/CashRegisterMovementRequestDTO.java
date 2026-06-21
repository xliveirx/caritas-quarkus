package br.com.caritas.dto.parish;

import br.com.caritas.entity.parish.CashMovementType;

import java.math.BigDecimal;

public record CashRegisterMovementRequestDTO(
        CashMovementType type,
        String description,
        Long cashRegisterId,
        BigDecimal amount
        ) {
}
