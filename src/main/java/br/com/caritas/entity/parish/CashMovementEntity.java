package br.com.caritas.entity.parish;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_cash_movements")
public class CashMovementEntity extends PanacheEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    public CashMovementType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false)
    public CashMovementOrigin origin;

    @Column(name = "description")
    public String description;

    @Column(name = "reference_id")
    public Long referenceId;

    @ManyToOne
    @JoinColumn(name = "cash_register", nullable = false)
    public CashRegisterEntity cashRegister;

    @Column(name = "occured_at", nullable = false)
    public LocalDateTime occuredAt;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    public BigDecimal amount;

}
