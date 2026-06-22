package br.com.caritas.resources;

import br.com.caritas.dto.donation.KitRequestDTO;
import br.com.caritas.service.KitService;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@ApplicationScoped
@Path("/api/v1/kits")
public class KitResource {

    @Inject
    private KitService kitService;

    @GET
    @Authenticated
    public Response getAllKits(@QueryParam("page") @DefaultValue("0") int page,
                               @QueryParam("size") @DefaultValue("10") int size,
                               @QueryParam("search") String search,
                               @QueryParam("active") Boolean active,
                               @QueryParam("parishId") Long parishId) {

        var kits = this.kitService.getAllKits(page, size, search, active, parishId);

        return Response.ok(kits).build();
    }

    @POST
    @Authenticated
    public Response createKit(@Valid KitRequestDTO req) {

        var kit = this.kitService.createKit(req);

        return Response
                .created(URI.create("/api/v1/kits/" + kit.id()))
                .entity(kit)
                .build();
    }

    @PATCH
    @Authenticated
    @Path("/deactivate/{id}")
    public Response deactivateKit(@PathParam("id") Long id) {

        this.kitService.deactivateKit(id);

        return Response.noContent().build();
    }

    @PATCH
    @Authenticated
    @Path("/activate/{id}")
    public Response activateKit(@PathParam("id") Long id) {

        this.kitService.activateKit(id);

        return Response.noContent().build();
    }
}
