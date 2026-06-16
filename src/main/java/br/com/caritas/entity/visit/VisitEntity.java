package br.com.caritas.entity.visit;

import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.UserEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_visits")
public class VisitEntity extends PanacheEntity {

    @Column(name = "scheduled_date", nullable = false)
    public LocalDateTime scheduledDate;

    @Column(name = "completed_date")
    public LocalDateTime completedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public VisitStatus status;

    @Column(name = "reason", nullable = false)
    public String reason;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    public FamilyEntity family;

    @ManyToOne
    @JoinColumn(name = "parish_id", nullable = false)
    public ParishEntity parish;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    public UserEntity user;

    @Column(name = "reminder_sent")
    public Boolean reminderSent = false;
}
