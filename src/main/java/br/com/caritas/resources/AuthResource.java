package br.com.caritas.resources;

import br.com.caritas.dto.user.*;
import br.com.caritas.service.AuthService;
import br.com.caritas.service.TokenService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/auth")
public class AuthResource {

    @Inject
    private AuthService authService;

    @Inject
    private TokenService tokenService;

    @POST
    @PermitAll
    @Path("/login")
    public Response login(@Valid LoginRequestDTO req) {

        var token = this.authService.login(req);

        return Response.ok(token).build();
    }

    @POST
    @PermitAll
    @Path("/refresh")
    public Response refresh(RefreshRequestDTO req) {

        var newAccessToken = this.tokenService.refresh(req.refreshToken());

        return Response.ok(new RefreshResponseDTO(newAccessToken)).build();

    }

    @POST
    @PermitAll
    @Path("/token")
    public Response setCredentials(CredentialsRequestDTO req) {

        this.authService.setCredentials(req);

        return Response.noContent().build();
    }

    @POST
    @PermitAll
    @Path("/resend-token")
    public Response resendToken(ResendTokenRequestDTO req) {

        this.authService.resendSetupToken(req.email());

        return Response.noContent().build();
    }

    @POST
    @PermitAll
    @Path("/forgot-password")
    public Response forgotPassword(ForgotPasswordRequestDTO req) {

        this.authService.forgotPassword(req);

        return Response.noContent().build();
    }

    @POST
    @PermitAll
    @Path("/reset-password")
    public Response resetPassword(CredentialsRequestDTO req) {

        this.authService.setCredentials(req);

        return Response.noContent().build();
    }
}
