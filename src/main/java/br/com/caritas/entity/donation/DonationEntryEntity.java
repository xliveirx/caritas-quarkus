package br.com.caritas.entity.donation;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tbl_donation_entries")
public class DonationEntryEntity extends PanacheEntity {

    @Column(name = "date", nullable = false)
    public LocalDateTime date;

    @Column(name = "donator", nullable = false)
    public String donator;

    @Column(name = "observation")
    public String observation;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public Status status;

    @ManyToOne
    @JoinColumn(name = "parish_id", nullable = false)
    public ParishEntity parish;

    @OneToMany(mappedBy = "donationEntry")
    public List<EntryBatchEntity> batches;
}
