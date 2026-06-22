package br.com.caritas.service;

import br.com.caritas.entity.user.AdminEntity;
import br.com.caritas.entity.user.CoordinatorEntity;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.entity.user.VolunteerEntity;
import br.com.caritas.exception.AuthException;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@ApplicationScoped
public class TokenService {

    private final Logger log = LoggerFactory.getLogger(TokenService.class);

    @Inject
    private JWTParser jwtParser;

    private static final String CLAIM_TOKEN_TYPE = "token_type";
    private static final String REFRESH_TYPE = "refresh";

    public String generateToken(UserEntity user) {
        String role = switch (user) {
            case AdminEntity admin -> "ADMIN";
            case CoordinatorEntity coordinator -> "COORDINATOR";
            case VolunteerEntity volunteer -> "VOLUNTEER";
            default -> null;
        };

        var jwt = Jwt.issuer("caritas")
                .subject(user.email)
                .expiresIn(Duration.ofMinutes(30))
                .groups(role);

        if (user instanceof CoordinatorEntity c) {
            jwt.claim("parish", (c.parish.id));
        } else if (user instanceof VolunteerEntity v) {
            jwt.claim("parish", (v.parish.id));
        }
        return jwt.sign();
    }

    public String generateRefreshToken(UserEntity user) {

        return Jwt.issuer("caritas")
                .subject(user.email)
                .claim(CLAIM_TOKEN_TYPE, REFRESH_TYPE)
                .expiresIn(Duration.ofDays(1))
                .sign();
    }

    @Transactional
    public String refresh(String refreshToken) {
        try {

            log.info("Refresh token recebido, gerando novo token...");

            JsonWebToken jwt = jwtParser.parse(refreshToken);

            if (!REFRESH_TYPE.equals(jwt.getClaim(CLAIM_TOKEN_TYPE))) {
                throw new AuthException(
                        "Token inválido.",
                        "Tipo de token inválido."
                );
            }

            UserEntity user = UserEntity.<UserEntity>find(
                            "email = ?1 and active = ?2", jwt.getSubject(), Boolean.TRUE)
                    .firstResultOptional()
                    .orElseThrow(() -> new AuthException(
                            "Usuário não encontrado.",
                            "Usuário não encontrado com e-mail " + jwt.getSubject()));

            return generateToken(user);

        } catch (ParseException e) {
            throw new AuthException(
                    "Token inválido.",
                    "Tente logar novamente."
            );
        }
    }
}
