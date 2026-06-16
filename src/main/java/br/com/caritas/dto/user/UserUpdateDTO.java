package br.com.caritas.dto.user;

public record UserUpdateDTO(
        String name,
        String password,
        String confirmPassword) {
}
