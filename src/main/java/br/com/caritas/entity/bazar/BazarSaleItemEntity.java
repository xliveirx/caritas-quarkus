package br.com.caritas.entity.bazar;

import br.com.caritas.entity.donation.StockItemEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tbl_bazar_sale_items")
public class BazarSaleItemEntity extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "sale_id", nullable = false)
    public BazarSaleEntity sale;

    @ManyToOne
    @JoinColumn(name = "stock_item_id", nullable = false)
    public StockItemEntity stockItem;

    @Column(name = "quantity", nullable = false)
    public Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    public BigDecimal unitPrice;
}
