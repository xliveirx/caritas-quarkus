package br.com.caritas.exception;

public class AuthException extends RuntimeException {
    private final String title;

    public AuthException (String title, String message) {
        super(message);
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
