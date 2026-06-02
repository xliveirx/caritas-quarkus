package br.com.caritas.service;

import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.reactive.ReactiveMailer;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@ApplicationScoped
public class EmailService {

    @Inject
    private ReactiveMailer mailer;

    private String welcomeTemplate;
    private String resetPasswordTemplate;
    private String visitReminderTemplate;

    @PostConstruct
    public void init() throws IOException {
        try (var stream = getClass().getClassLoader().getResourceAsStream("/templates/welcome-email.html")) {
            if (stream == null) throw new ResourceNotFoundException(
                    "Email template not found.",
                    "Could not find welcome email template in resources/templates/welcome-email.html");
            this.welcomeTemplate = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
        try (var stream = getClass().getClassLoader().getResourceAsStream("/templates/reset-password-email.html")) {
            if (stream == null) throw new ResourceNotFoundException(
                    "Email template not found.",
                    "Could not find reset-password email template in resources/templates/reset-password-email.html");
            this.resetPasswordTemplate = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
        try (var stream = getClass().getClassLoader().getResourceAsStream("/templates/visit-reminder-email.html")) {
            if (stream == null) throw new ResourceNotFoundException(
                    "Email template not found.",
                    "Could not find visit-reminder email template in resources/templates/visit-reminder-email.html");
            this.visitReminderTemplate = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public void sendWelcomeEmail(String name, String email, String token, String parish) {

        String html = this.welcomeTemplate
                .replace("{name}", name)
                .replace("{email}", email)
                .replace("{parish}", parish)
                .replace("{loginUrl}", "http://localhost:3000/setup-password?email="
                        + email
                        + "&token="
                        + token);

        mailer.send(Mail.withHtml(email, "Bem-vindo à Cáritas!", html)
                        .setFrom("Cáritas Diocesana de Caxias do Sul <" + email + ">"))
                .subscribe()
                .with(
                        success -> System.out.println("Email enviado com sucesso para " + email),
                        failure -> System.err.println("Falha ao enviar email para " + email + ": " + failure.getMessage())
                );
    }


    public void sendResetPasswordEmail(String name, String email, String token) {

        String html = this.resetPasswordTemplate
                .replace("{name}", name)
                .replace("{email}", email)
                .replace("{resetUrl}", "http://localhost:3000/reset-password?email="
                        + email
                        + "&token="
                        + token);

        mailer.send(Mail.withHtml(email, "Redefinição de senha — Cáritas Diocesana", html)
                        .setFrom("Cáritas Diocesana de Caxias do Sul <" + email + ">"))
                .subscribe()
                .with(
                        success -> System.out.println("Email de redefinição enviado para " + email),
                        failure -> System.err.println("Falha ao enviar email de redefinição para " + email + ": " + failure.getMessage())
                );
    }

    public void sendVisitReminderEmail(String volunteerName, String volunteerEmail,
                                       String scheduledDate, String scheduledTime,
                                       String familyName, String familyAddress) {

        String html = this.visitReminderTemplate
                .replace("{volunteerName}", volunteerName)
                .replace("{scheduledDate}", scheduledDate)
                .replace("{scheduledTime}", scheduledTime)
                .replace("{familyName}", familyName)
                .replace("{familyAddress}", familyAddress);

        mailer.send(Mail.withHtml(volunteerEmail, "Lembrete de visita para amanhã — Cáritas Diocesana", html)
                        .setFrom("Cáritas Diocesana de Caxias do Sul <contatocaritasdiocesana@gmail.com>"))
                .subscribe()
                .with(
                        success -> System.out.println("Lembrete de visita enviado para " + volunteerEmail),
                        failure -> System.err.println("Falha ao enviar lembrete de visita para " + volunteerEmail + ": " + failure.getMessage())
                );
    }
}
