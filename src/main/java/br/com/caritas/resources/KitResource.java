package br.com.caritas.resources;

import br.com.caritas.dto.donation.KitRequestDTO;
import br.com.caritas.service.KitService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.ResponseStatus;

@Resource
@Path("/api/v1/kits")
public class KitResource {

    @Inject
    private KitService kitService;

    @Inject
    private JsonWebToken jwt;

    @GET
    @Authenticated
    public Response getAllKits(@QueryParam("page") @DefaultValue("0") int page,
                               @QueryParam("size") @DefaultValue("10") int size,
                               @QueryParam("search") String search,
                               @QueryParam("active") Boolean active) {

        var kits = this.kitService.getAllKits(page, size, search, active, jwt);

        return Response.ok(kits).build();
    }

    @POST
    @Authenticated
    public Response createKit(KitRequestDTO req) {

        var kit = this.kitService.createKit(req, jwt);

        return Response.ok(kit).build();
    }

    @PATCH
    @Authenticated
    @Path("/deactivate/{id}")
    public Response deactivateKit(@PathParam("id") Long id) {

        this.kitService.deactivateKit(id, jwt);

        return Response.noContent().build();
    }

    @PATCH
    @Authenticated
    @Path("/activate/{id}")
    public Response activateKit(@PathParam("id") Long id) {

        this.kitService.activateKit(id, jwt);

        return Response.noContent().build();
    }
}
