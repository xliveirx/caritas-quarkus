package br.com.caritas.entity.donation;

import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_donation_exits")
public class DonationExitEntity extends PanacheEntity {

    @Column(name = "date")
    public LocalDateTime date;

    @Column(name = "observation")
    public String observation;

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public DonationStatus status;

    @ManyToOne
    @JoinColumn(name = "family_id")
    public FamilyEntity family;

    @OneToMany(mappedBy = "donationExit", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ExitBatchEntity> batches = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "kit_id", nullable = false)
    public KitEntity kit;

}
