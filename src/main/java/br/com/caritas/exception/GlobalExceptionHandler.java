package br.com.caritas.exception;

import br.com.caritas.dto.ErrorResponseDTO;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.LocalDateTime;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception e) {

        var status = switch(e) {
            case BusinessRuleException ex -> Response.Status.BAD_REQUEST.getStatusCode();
            case ResourceNotFoundException ex -> Response.Status.NOT_FOUND.getStatusCode();
            case AuthException ex -> Response.Status.UNAUTHORIZED.getStatusCode();
            default -> Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
        };

        var title = switch(e) {
            case BusinessRuleException ex -> ex.getTitle();
            case ResourceNotFoundException ex -> ex.getTitle();
            case AuthException ex -> ex.getTitle();
            default -> "Internal Server Error.";
        };

        return Response.status(status)
                .entity(new ErrorResponseDTO(
                        title,
                        e.getMessage(),
                        status,
                        LocalDateTime.now(),
                        null
                ))
                .build();
    }
}
