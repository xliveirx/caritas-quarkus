package br.com.caritas.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tbl_admins")
public class AdminEntity extends UserEntity {

}
