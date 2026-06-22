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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Inject
    private TokenService tokenService;

    @Inject
    private EmailService emailService;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO req) {

        UserEntity user = UserEntity.<UserEntity>find("email = ?1 and active = ?2", req.email(), Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new AuthException(
                        "Erro de autenticação.",
                        "Senha ou e-mail incorretos."));

        if(!BcryptUtil.matches(req.password(), user.password)){
            throw new AuthException(
                    "Erro de autenticação.",
                    "Senha ou e-mail incorretos.");
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
                                        "Usuário não encontrado.",
                                        "Usuário não encontrado com e-mail " + req.email()
                                ));

        if(user.resetToken == null) throw new BusinessRuleException("Token inválido.", "O token é inválido ou já expirou.");

        if(!BcryptUtil.matches(req.token(), user.resetToken)) {
            throw new AuthException(
                    "Token inválido.",
                    "O token é inválido ou já expirou."
            );
        }

        if(user.resetTokenExpiresAt.isBefore(Instant.now())) {
            throw new AuthException(
                    "Token inválido.",
                    "O token já expirou."
            );
        }

        if(!req.password().equals(req.confirmPassword())) {
            throw new BusinessRuleException(
                    "Erro de senha.",
                    "As senhas informadas não coincidem."
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
                        "Usuário não encontrado.",
                        "Usuário não encontrado com e-mail " + email));

        String token = UUID.randomUUID().toString();
        user.resetToken = BcryptUtil.bcryptHash(token);
        user.resetTokenExpiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
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
                        "Usuário não encontrado.",
                        "Usuário não encontrado com e-mail " + req.email()
                ));

        String token = UUID.randomUUID().toString();
        user.resetToken = BcryptUtil.bcryptHash(token);
        user.resetTokenExpiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        user.persist();

        this.emailService.sendResetPasswordEmail(
                user.name,
                user.email,
                token);
    }
}
