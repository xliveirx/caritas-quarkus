package br.com.caritas.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_family_members")
public class FamilyMemberEntity extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "family_id")
    public FamilyEntity family;

    public String name;

    public String cpf;

    public LocalDate birthDate;

    public String motherName;

    public boolean responsible;

    @CreationTimestamp
    public LocalDateTime createdAt;

    @UpdateTimestamp
    public LocalDateTime updatedAt;
}
