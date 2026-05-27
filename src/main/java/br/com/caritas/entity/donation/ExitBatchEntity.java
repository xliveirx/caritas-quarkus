package br.com.caritas.entity.donation;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tbl_exit_batches")
public class ExitBatchEntity extends PanacheEntity {

    @Column(name = "quantity", nullable = false, precision = 19, scale = 4)
    public BigDecimal quantity;

    @ManyToOne
    @JoinColumn(name = "stock_item_id", nullable = false)
    public StockItemEntity stockItem;

    @ManyToOne
    @JoinColumn(name = "donation_exit_id", nullable = false)
    public DonationExitEntity donationExit;

}
