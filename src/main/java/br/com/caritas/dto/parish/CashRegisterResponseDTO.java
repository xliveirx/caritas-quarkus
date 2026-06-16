package br.com.caritas.dto.parish;

import br.com.caritas.entity.parish.CashRegisterEntity;

import java.math.BigDecimal;
import java.util.List;

public record CashRegisterResponseDTO (
        Long id,
        ParishResponseDTO parish,
        BigDecimal balance,
        List<CashMovementResponseDTO> movements
){
    public static CashRegisterResponseDTO fromEntity(CashRegisterEntity entity){
        return new CashRegisterResponseDTO(
                entity.id,
                ParishResponseDTO.fromEntity(entity.parish),
                entity.balance,
                entity.movements.stream().map(CashMovementResponseDTO::fromEntity).toList()
        );
    }
}
