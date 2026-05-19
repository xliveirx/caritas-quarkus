package br.com.caritas.exception;

public class BusinessRuleException extends RuntimeException {
    private final String title;

    public BusinessRuleException(String title, String message) {
        super(message);
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
