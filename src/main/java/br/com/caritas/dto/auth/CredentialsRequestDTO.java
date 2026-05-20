package br.com.caritas.dto.auth;

public record CredentialsRequestDTO(
        String email,
        String password,
        String confirmPassword,
        String token) {
}
