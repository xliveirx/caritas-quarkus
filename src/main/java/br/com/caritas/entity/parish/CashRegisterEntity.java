package br.com.caritas.entity.parish;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "tbl_cash_registers")
public class CashRegisterEntity extends PanacheEntity {

    @OneToOne
    @JoinColumn(name = "parish_id", nullable = false)
    public ParishEntity parish;

    @Column(name = "balance", nullable = false, precision = 10, scale = 2)
    public BigDecimal balance;

    @OneToMany(mappedBy = "cashRegister", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<CashMovementEntity> movements;
}
