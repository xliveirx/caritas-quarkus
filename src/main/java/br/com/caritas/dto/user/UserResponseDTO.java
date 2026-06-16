package br.com.caritas.dto.user;

import br.com.caritas.entity.user.UserEntity;

public record UserResponseDTO(
        Long id,
        String name,
        String email
) {

    public static UserResponseDTO fromEntity(UserEntity entity) {
        return new UserResponseDTO(
                entity.id,
                entity.name,
                entity.email
        );
    }
}
