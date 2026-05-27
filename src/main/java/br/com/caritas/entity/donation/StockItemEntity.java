package br.com.caritas.entity.donation;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tbl_stock_items")
public class StockItemEntity extends PanacheEntity {

    @Column(name = "available_quantity", nullable = false, precision = 19, scale = 4)
    public BigDecimal availableQuantity;

    @ManyToOne
    @JoinColumn(name = "parish_id", nullable = false)
    public ParishEntity parish;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    public ProductEntity product;
}
