package br.com.caritas.exception;

public class ResourceNotFoundException extends RuntimeException {
    private final String title;

    public ResourceNotFoundException(String title, String message) {
        super(message);
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
