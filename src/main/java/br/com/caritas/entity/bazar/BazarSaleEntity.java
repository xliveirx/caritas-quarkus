package br.com.caritas.entity.bazar;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_bazar_sales")
public class BazarSaleEntity extends PanacheEntity {

    @Column(name = "buyer_name", nullable = false, length = 100)
    public String buyerName;

    @Column(name = "buyer_cpf", nullable = false)
    public String buyerCpf;

    @Column(name = "sold_at", nullable = false)
    public LocalDateTime soldAt;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    public BigDecimal total;

    @ManyToOne
    @JoinColumn(name = "parish_id", nullable = false)
    public ParishEntity parish;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<BazarSaleItemEntity> items = new ArrayList<>();

}
