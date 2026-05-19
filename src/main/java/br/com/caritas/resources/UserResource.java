package br.com.caritas.resources;

import br.com.caritas.dto.UserUpdateDTO;
import br.com.caritas.service.UserService;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/users")
public class UserResource {

    @Inject
    private JsonWebToken jwt;

    @Inject
    private UserService userService;

    @GET
    public Response getUserById() {

        var user = this.userService.getUserById(jwt);

        return Response.ok(user).build();
    }

    @PUT
    public Response updateUser(UserUpdateDTO req) {

        var user = this.userService.updateUser(req, jwt);

        return Response.ok(user).build();
    }
}
