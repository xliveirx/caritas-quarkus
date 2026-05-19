package br.com.caritas.service;

import br.com.caritas.entity.AdminEntity;
import br.com.caritas.entity.CoordinatorEntity;
import br.com.caritas.entity.UserEntity;
import br.com.caritas.entity.VolunteerEntity;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@ApplicationScoped
public class TokenService {

    public String generateToken(UserEntity user) {
        String role = switch(user) {
            case AdminEntity admin -> "ADMIN";
            case CoordinatorEntity coordinator -> "COORDINATOR";
            case VolunteerEntity volunteer -> "VOLUNTEER";
            default -> null;
        };

        var jwt = Jwt.upn(user.email)
                .expiresAt(expiresAt(5))
                .groups(role)
                .issuer("caritas");

        if(user instanceof CoordinatorEntity c){
            jwt.claim("parish", (c.parish.id));
        } else if(user instanceof VolunteerEntity v){
            jwt.claim("parish", (v.parish.id));
        }
        return jwt.sign();
    }

    private Instant expiresAt(int minutes) {
        return Instant.now().plus(minutes, ChronoUnit.MINUTES);
    }
}
