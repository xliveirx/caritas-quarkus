package br.com.caritas.entity.parish;

import br.com.caritas.entity.Address;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_parishes")
public class ParishEntity extends PanacheEntity {

    @Column(name = "name", nullable = false)
    public String name;

    @Embedded
    public Address address;

    @Column(name = "cnpj", nullable = false, unique = true)
    public String cnpj;

    @Column(name = "is_diocese", nullable = false)
    public Boolean isDiocese = Boolean.FALSE;

    @CreationTimestamp
    public LocalDateTime createdAt;

    @UpdateTimestamp
    public LocalDateTime updatedAt;
}
