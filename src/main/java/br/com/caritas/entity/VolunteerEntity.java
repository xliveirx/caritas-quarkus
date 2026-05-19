package br.com.caritas.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_volunteers")
public class VolunteerEntity extends UserEntity {

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;
}
