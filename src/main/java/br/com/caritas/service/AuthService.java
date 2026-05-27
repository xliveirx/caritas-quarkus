package br.com.caritas.service;

import br.com.caritas.dto.user.CredentialsRequestDTO;
import br.com.caritas.dto.user.ForgotPasswordRequestDTO;
import br.com.caritas.dto.user.LoginRequestDTO;
import br.com.caritas.dto.user.LoginResponseDTO;
import br.com.caritas.entity.user.CoordinatorEntity;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.entity.user.VolunteerEntity;
import br.com.caritas.exception.AuthException;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Inject
    private TokenService tokenService;

    @Inject
    private EmailService emailService;

    public LoginResponseDTO login(LoginRequestDTO req) {

        UserEntity user = UserEntity.<UserEntity>find("email = ?1 and active = ?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User with email " + req.email() + " not found"));

        if(!BcryptUtil.matches(req.password(), user.password)){
            throw new AuthException(
                    "Authentication error.",
                    "Password or e-mail is incorrect.");
        }

        String token = this.tokenService.generateToken(user);
        String refreshToken = this.tokenService.generateRefreshToken(user);

        return new LoginResponseDTO(token, refreshToken);
    }

    @Transactional
    public void setCredentials(CredentialsRequestDTO req) {

        UserEntity user = UserEntity.<UserEntity>find(
                "email = ?1", req.email())
                        .firstResultOptional()
                                .orElseThrow(() -> new ResourceNotFoundException(
                                        "User not found.",
                                        "User not found with email " + req.email()
                                ));

        if(user.resetToken == null) throw new BusinessRuleException("Invalid token", "The token is invalid or expired");

        if(!BcryptUtil.matches(req.token(), user.resetToken)) {
            throw new AuthException(
                    "Invalid token.",
                    "The token informed is invalid."
            );
        }

        if(user.resetTokenExpiresAt.isBefore(LocalDateTime.now())) {
            throw new AuthException(
                    "Invalid token.",
                    "The token has expired."
            );
        }

        if(!req.password().equals(req.confirmPassword())) {
            throw new BusinessRuleException(
                    "Passwords mismatch.",
                    "The passwords informed don't match."
            );
        }

        user.password = BcryptUtil.bcryptHash(req.password());
        user.active = Boolean.TRUE;
        user.resetToken = null;
        user.resetTokenExpiresAt = null;
    }


    @Transactional
    public void resendSetupToken(String email) {

        UserEntity user = UserEntity.<UserEntity>find(
                        "email = ?1 and password IS NULL", email)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User not found with email " + email));

        String token = UUID.randomUUID().toString();
        user.resetToken = BcryptUtil.bcryptHash(token);
        user.resetTokenExpiresAt = LocalDateTime.now().plusMinutes(15);
        user.persist();

        String parishName = resolveParishName(user);

        emailService.sendWelcomeEmail(
                user.name,
                user.email,
                token,
                parishName);
    }

    private String resolveParishName(UserEntity user) {
        return VolunteerEntity.<VolunteerEntity>findByIdOptional(user.id)
                .map(v -> v.parish.name)
                .or(() -> CoordinatorEntity.<CoordinatorEntity>findByIdOptional(user.id)
                        .map(c -> c.parish.name))
                .orElse("");
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO req) {

        UserEntity user = UserEntity.<UserEntity>find(
                        "email = ?1 and active =?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found.",
                        "User not found with email " + req.email()
                ));

        String token = UUID.randomUUID().toString();
        user.resetToken = BcryptUtil.bcryptHash(token);
        user.resetTokenExpiresAt = LocalDateTime.now().plusSeconds(15);

        this.emailService.sendResetPasswordEmail(
                user.name,
                user.email,
                token);
    }
}
