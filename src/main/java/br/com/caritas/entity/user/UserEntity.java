package br.com.caritas.entity.user;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_users")
@Inheritance(strategy = InheritanceType.JOINED)
public class UserEntity extends PanacheEntity {

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "email", nullable = false)
    public String email;

    @Column(name = "password")
    public String password;

    @CreationTimestamp
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "active", nullable = false)
    public boolean active;

    @Column(name = "reset_token")
    public String resetToken;

    @Column(name = "reset_token_expires_at")
    public LocalDateTime resetTokenExpiresAt;
}
