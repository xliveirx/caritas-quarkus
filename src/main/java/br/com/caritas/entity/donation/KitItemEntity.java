package br.com.caritas.entity.donation;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import io.smallrye.mutiny.Uni;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tbl_kit_items")
public class KitItemEntity extends PanacheEntity {

    @Column(name = "quantity", nullable = false)
    public BigDecimal quantity;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    public ProductEntity product;

    @ManyToOne
    @JoinColumn(name = "kit_id", nullable = false)
    public KitEntity kit;
}
