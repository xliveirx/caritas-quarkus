package br.com.caritas.resources;

import br.com.caritas.dto.user.CoordinatorRequestDTO;
import br.com.caritas.dto.user.CoordinatorUpdateDTO;
import br.com.caritas.service.CoordinatorService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@Resource
@Path("/api/v1/coordinators")
public class CoordinatorResource {

    @Inject
    private CoordinatorService coordinatorService;

    @GET
    @Authenticated
    @Path("/parish/{parishId}")
    public Response getAllCoordinatorsByParish(@QueryParam("page") @DefaultValue("0") int page,
                                               @QueryParam("size") @DefaultValue("10") int size,
                                               @PathParam("parishId") Long parishId) {

        var coordinators = this.coordinatorService.getAllCoordinatorsByParish(page, size, parishId);

        return Response.ok(coordinators).build();
    }

    @GET
    @RolesAllowed("ADMIN")
    @Path("/{id}")
    public Response getCoordinatorById(@PathParam("id") Long id) {

        var coordinator = this.coordinatorService.getCoordinatorById(id);

        return Response.ok(coordinator).build();
    }

    @POST
    @RolesAllowed("ADMIN")
    public Response createCoordinatorUser(@Valid CoordinatorRequestDTO req) {

        var coordinator = this.coordinatorService.createCoordinator(req);

        return Response
                .created(URI.create("/api/v1/coordinator/" + coordinator.id()))
                .entity(coordinator)
                .build();
    }


    @PUT
    @RolesAllowed("ADMIN")
    @Path("/{id}")
    public Response updateCoordinator(@PathParam("id") Long id,
                                      CoordinatorUpdateDTO req) {

        var coordinator = this.coordinatorService.updateCoordinator(id, req);

        return Response.ok(coordinator).build();
    }

    @PATCH
    @Path("/deactivate/{id}")
    @RolesAllowed("ADMIN")
    public Response deactivateCoordinatorUser(@PathParam("id") long id) {

        this.coordinatorService.deactivateCoordinator(id);

        return Response.noContent().build();
    }

    @PATCH
    @Path("/activate/{id}")
    @RolesAllowed("ADMIN")
    public Response activateCoordinatorUser(@PathParam("id") long id) {

        this.coordinatorService.activateCoordinator(id);

        return Response.noContent().build();
    }
}
