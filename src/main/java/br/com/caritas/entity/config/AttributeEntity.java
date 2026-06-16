package br.com.caritas.entity.config;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "tbl_attributes")
public class AttributeEntity extends PanacheEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    public AttributeType type;

    @Column(name = "label", nullable = false)
    public String label;

    @Column(name = "position")
    public Integer position;
}
