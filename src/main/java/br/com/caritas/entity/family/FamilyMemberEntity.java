package br.com.caritas.entity.family;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
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

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "cpf")
    public String cpf;

    @Column(name = "birth_date")
    public LocalDate birthDate;

    @Column(name = "mother_name")
    public String motherName;

    @Column(name = "responsible", nullable = false)
    public boolean responsible;

    @CreationTimestamp
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
}
