package br.com.caritas.dto;

public record UserUpdateDTO(
        String name,
        String password,
        String confirmPassword) {
}
