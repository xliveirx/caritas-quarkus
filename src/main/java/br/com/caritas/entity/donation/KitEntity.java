package br.com.caritas.entity.donation;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_kits")
public class KitEntity extends PanacheEntity {

    @Column(name = "name", nullable = false, unique = true)
    public String name;

    @Column(name = "description")
    public String description;

    @Column(name = "active", nullable = false)
    public Boolean active;

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;

    @OneToMany(mappedBy = "kit", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<KitItemEntity> items = new ArrayList<>();

}
