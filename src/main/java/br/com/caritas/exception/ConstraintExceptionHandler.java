package br.com.caritas.exception;

import br.com.caritas.dto.ErrorResponseDTO;
import br.com.caritas.dto.ViolationDTO;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.time.LocalDateTime;

@Provider
public class ConstraintExceptionHandler implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException e) {
        var errors = e.getConstraintViolations()
                .stream()
                .map(v -> {
                    String field = v.getPropertyPath().toString();
                    field = field.substring(field.lastIndexOf('.') + 1);
                    return new ViolationDTO(field, v.getMessage());
                }).toList();

        return Response.status(Response.Status.BAD_REQUEST.getStatusCode())
                .entity(new ErrorResponseDTO(
                        "Validation Error",
                        "One or more fields are invalid.",
                        Response.Status.BAD_REQUEST.getStatusCode(),
                        LocalDateTime.now(),
                        errors
                ))
                .build();
    }
}
