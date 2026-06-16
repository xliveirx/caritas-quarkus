package br.com.caritas.service;

import br.com.caritas.dto.parish.CashRegisterResponseDTO;
import br.com.caritas.entity.bazar.BazarSaleEntity;
import br.com.caritas.entity.parish.CashMovementEntity;
import br.com.caritas.entity.parish.CashMovementOrigin;
import br.com.caritas.entity.parish.CashMovementType;
import br.com.caritas.entity.parish.CashRegisterEntity;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;

@ApplicationScoped
public class CashRegisterService {

    @Inject
    private JwtParishContext parishContext;


    @Transactional
    public CashRegisterResponseDTO getCashRegister(Long parishId) {

        Long resolvedParishId = this.parishContext.resolveParishId(parishId);

        CashRegisterEntity cashRegister = CashRegisterEntity.<CashRegisterEntity>find(
                "parish.id = ?1", resolvedParishId)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Caixa não encontrado",
                        "Caixa não encontrado para a paróquia com id " + resolvedParishId
                ));

        return CashRegisterResponseDTO.fromEntity(cashRegister);
    }

    @Transactional
    public void registerFromBazar(BazarSaleEntity sale) {

        CashRegisterEntity cashRegister = CashRegisterEntity.<CashRegisterEntity>find(
                "parish.id = ?1", sale.parish.id)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Caixa não encontrado",
                        "Caixa não encontrado para a paróquia com id " + sale.parish.id
                ));

        CashMovementEntity movement = new CashMovementEntity();

        movement.type = CashMovementType.INCOME;
        movement.origin = CashMovementOrigin.BAZAR;
        movement.referenceId = sale.id;
        movement.cashRegister = cashRegister;
        movement.occuredAt = LocalDateTime.now();
        movement.amount = sale.total;
        movement.persist();

        cashRegister.movements.add(movement);
        cashRegister.balance = cashRegister.balance.add(sale.total);
        cashRegister.persist();
    }
}
