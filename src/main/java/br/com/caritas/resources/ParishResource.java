package br.com.caritas.resources;

import br.com.caritas.dto.parish.ParishRequestDTO;
import br.com.caritas.dto.parish.ParishUpdateDTO;
import br.com.caritas.service.ParishService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/parishes")
public class ParishResource {

    @Inject
    private ParishService parishService;

    @GET
    @RolesAllowed("ADMIN")
    public Response getAllParishes(@QueryParam("page") @DefaultValue("0") int page,
                                   @QueryParam("size") @DefaultValue("10") int size) {

        var parishes = this.parishService.getAllParishes(page, size);

        return Response.ok(parishes).build();
    }

    @GET
    @RolesAllowed("ADMIN")
    @Path("/{id}")
    public Response getParishById(@PathParam("id") Long id) {

        var parish = this.parishService.getParishById(id);

        return Response.ok(parish).build();
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response createParish(@Valid ParishRequestDTO req) {

        var parish = this.parishService.createParish(req);

        return Response.ok(parish).build();
    }

    @PUT
    @RolesAllowed("ADMIN")
    @Path("/{id}")
    public Response updateParish(@Valid ParishUpdateDTO req,
                                 @PathParam("id") Long id) {

        var parish = this.parishService.updateParish(req, id);

        return Response.ok(parish).build();
    }

    @DELETE
    @RolesAllowed("ADMIN")
    @Path("/{id}")
    public Response deleteParish(@PathParam("id") Long id) {

        this.parishService.deleteParish(id);

        return Response.noContent().build();
    }
}
