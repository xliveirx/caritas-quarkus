package br.com.caritas.service;

import br.com.caritas.entity.visit.VisitEntity;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@ApplicationScoped
public class VisitReminderScheduler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Inject
    private EmailService emailService;

    @Transactional
    @Scheduled(cron = "0 0 8 * * ?") // Executa diariamente às 8h
    public void sendReminder() {

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime start = tomorrow.atStartOfDay();
        LocalDateTime end = tomorrow.atTime(LocalTime.MAX);

        List<VisitEntity> visits = VisitEntity.<VisitEntity>find(
                "scheduledDate >= ?1 and scheduledDate <= ?2 and reminderSent = ?3",
                        start, end, Boolean.FALSE)
                .list();

        for (VisitEntity visit : visits) {
            String familyName = visit.family.members.stream()
                    .filter(m -> m.responsible)
                    .map(m -> m.name)
                    .findFirst()
                    .orElse("Família #" + visit.family.id);

            String familyAddress = buildAddress(visit);

            boolean sent = emailService.sendVisitReminderEmail(
                    visit.user.name,
                    visit.user.email,
                    visit.scheduledDate.format(DATE_FMT),
                    visit.scheduledDate.format(TIME_FMT),
                    familyName,
                    familyAddress
            );

            if (sent) {
                visit.reminderSent = true;
                visit.persist();
            }
        }
    }

    private String buildAddress(VisitEntity visit) {
        var addr = visit.family.address;
        if (addr == null) return "Endereço não cadastrado";

        StringBuilder sb = new StringBuilder();
        if (addr.street != null) sb.append(addr.street);
        if (addr.number != null) sb.append(", ").append(addr.number);
        if (addr.complement != null && !addr.complement.isBlank()) sb.append(" — ").append(addr.complement);
        if (addr.city != null) sb.append(", ").append(addr.city);
        if (addr.state != null) sb.append("/").append(addr.state);
        return sb.isEmpty() ? "Endereço não cadastrado" : sb.toString();
    }

}
