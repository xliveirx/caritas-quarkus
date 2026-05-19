package br.com.caritas.dto;

public record PaginationDTO(int page, int size, int totalPages, long totalItems) {
}
