package br.com.caritas.entity.donation;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "tbl_entry_batches")
public class EntryBatchEntity extends PanacheEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false)
    public Unit unit;

    @Column(name = "quantity", nullable = false)
    public Integer quantity;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    public ProductEntity product;

    @ManyToOne
    @JoinColumn(name = "donation_entry_id", nullable = false)
    public DonationEntryEntity donationEntry;

}
