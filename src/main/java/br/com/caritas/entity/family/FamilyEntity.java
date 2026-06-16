package br.com.caritas.entity.family;

import br.com.caritas.entity.Address;
import br.com.caritas.entity.donation.DonationExitEntity;
import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "tbl_families")
public class FamilyEntity extends PanacheEntity {

    @OneToMany(mappedBy = "family", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<FamilyMemberEntity> members;

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;

    @Column(name = "monthly_income")
    public BigDecimal monthlyIncome;

    @Column(name = "bolsa_familia", nullable = false)
    public boolean bolsaFamilia;

    @Enumerated(EnumType.STRING)
    @Column(name = "situation", nullable = false)
    public Situation situation;

    @Column(name = "observation")
    public String observation;

    @Embedded
    @Column(name = "address")
    public Address address;

}
