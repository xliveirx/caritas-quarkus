package br.com.caritas.entity.donation;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;

@Entity
@Table(name = "tbl_donation_exits")
public class DonationExitEntity extends PanacheEntity {

    @CreationTimestamp
    @Column(name = "date")
    public LocalDate date;

    @Column(name = "observation")
    public String observation;

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;

}
