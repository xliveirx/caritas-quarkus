package br.com.caritas.entity.user;

import br.com.caritas.entity.parish.ParishEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "tbl_volunteers")
public class VolunteerEntity extends UserEntity {

    @ManyToOne
    @JoinColumn(name = "parish_id")
    public ParishEntity parish;
}
