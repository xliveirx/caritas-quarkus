package br.com.caritas.service;

import br.com.caritas.dto.user.UserResponseDTO;
import br.com.caritas.dto.user.UserUpdateDTO;
import br.com.caritas.entity.user.UserEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class UserService {

    public UserResponseDTO getUserById(JsonWebToken jwt) {

        String email = jwt.getName();

        UserEntity user = UserEntity.<UserEntity>find("email = ?1 and active = ?2", email, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado.",
                        "Usuário não encontrado com e-mail " + email
                ));

        return new UserResponseDTO(user.id, user.name, user.email);
    }

    @Transactional
    public UserResponseDTO updateUser(UserUpdateDTO req, JsonWebToken jwt) {

        String email = jwt.getName();

        UserEntity user = UserEntity.<UserEntity>find("email = ?1 and active = ?2", email, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado.",
                        "Usuário não encontrado com e-mail " + email
                ));

        if(req.name() != null) {
            user.name = req.name();
        }

        if(req.password() != null && req.confirmPassword() != null) {
            if(!req.password().equals(req.confirmPassword())) {
                throw new BusinessRuleException(
                        "Erro de senha.",
                        "As senhas informadas não coincidem.");
            }
            user.password = BcryptUtil.bcryptHash(req.password());
        }

        user.persist();
        return new UserResponseDTO(user.id, user.name, user.email);
    }
}
