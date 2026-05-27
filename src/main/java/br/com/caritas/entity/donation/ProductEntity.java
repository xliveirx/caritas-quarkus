package br.com.caritas.entity.donation;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "tbl_products")
@Inheritance(strategy = InheritanceType.JOINED)
public class ProductEntity extends PanacheEntity {

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "description")
    public String description;

    @Column(name = "active")
    public Boolean active;

    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    public ProductType type;


    @Enumerated(EnumType.STRING)
    @Column(name = "unit")
    public Unit defaultUnit;
}
