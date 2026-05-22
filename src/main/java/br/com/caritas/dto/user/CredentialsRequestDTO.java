package br.com.caritas.dto.user;

public record CredentialsRequestDTO(
        String email,
        String password,
        String confirmPassword,
        String token) {
}
