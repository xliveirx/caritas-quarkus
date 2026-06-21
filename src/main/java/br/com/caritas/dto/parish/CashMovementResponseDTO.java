package br.com.caritas.dto.parish;

import br.com.caritas.entity.parish.CashMovementEntity;
import br.com.caritas.entity.parish.CashMovementOrigin;
import br.com.caritas.entity.parish.CashMovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashMovementResponseDTO(
        Long id,
        CashMovementType type,
        CashMovementOrigin origin,
        String description,
        Long referenceId,
        LocalDateTime occuredAt,
        BigDecimal amount
) {
    public static CashMovementResponseDTO fromEntity(CashMovementEntity entity) {
        return new CashMovementResponseDTO(
                entity.id,
                entity.type,
                entity.origin,
                entity.description,
                entity.referenceId,
                entity.occuredAt,
                entity.amount
        );
    }
}
