package br.com.caritas.resources;

import br.com.caritas.dto.auth.LoginRequestDTO;
import br.com.caritas.service.AuthService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/auth/login")
public class AuthResource {

    @Inject
    private AuthService authService;

    @POST
    @PermitAll
    @Transactional
    public Response login(@Valid LoginRequestDTO req) {

        var token = this.authService.login(req);

        return Response.ok(token).build();
    }
}
