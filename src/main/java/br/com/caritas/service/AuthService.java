package br.com.caritas.service;

import br.com.caritas.dto.auth.LoginRequestDTO;
import br.com.caritas.dto.auth.LoginResponseDTO;
import br.com.caritas.entity.UserEntity;
import br.com.caritas.exception.AuthException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthService {

    @Inject
    private TokenService tokenService;

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

        return new LoginResponseDTO(token);
    }
}
