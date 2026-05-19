package br.com.caritas.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tbl_coordinators")
public class CoordinatorEntity extends UserEntity {

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;
}
