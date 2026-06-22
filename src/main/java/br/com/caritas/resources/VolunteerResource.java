package br.com.caritas.resources;

import br.com.caritas.dto.user.VolunteerRequestDTO;
import br.com.caritas.dto.user.VolunteerUpdateDTO;
import br.com.caritas.service.VolunteerService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@ApplicationScoped
@Path("/api/v1/volunteers")
public class VolunteerResource {

    @Inject
    private VolunteerService volunteerService;

    @GET
    @Authenticated
    @Path("/parish/{parishId}")
    public Response getAllVolunteersByParishId(@QueryParam("page") @DefaultValue("0") int page,
                                              @QueryParam("size") @DefaultValue("10") int size,
                                              @PathParam("parishId") Long parishId,
                                              @QueryParam("search") String search,
                                              @QueryParam("active") Boolean active) {

        var volunteers = this.volunteerService.getAllVolunteersByParishId(page, size, parishId, search, active);

        return Response.ok(volunteers).build();
    }

    @GET
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    @Path("/{id}")
    public Response getVolunteerById(@PathParam("id") Long id) {

        var volunteer = this.volunteerService.getVolunteerById(id);

        return Response.ok(volunteer).build();
    }

    @POST
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response createVolunteer(@Valid VolunteerRequestDTO req) {

        var volunteer = this.volunteerService.createVolunteer(req);

        return Response
                .created(URI.create("/api/v1/volunteers/" + volunteer.id()))
                .entity(volunteer)
                .build();
    }

    @PUT
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    @Path("/{id}")
    public Response updateVolunteer(@PathParam("id") Long id,
                                    @Valid VolunteerUpdateDTO req) {

        var volunteer = this.volunteerService.updateVolunteer(id, req);

        return Response.ok(volunteer).build();
    }

    @PATCH
    @Path("/deactivate/{id}")
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response deactivateVolunteer(@PathParam("id") long id) {

        this.volunteerService.deactivateVolunteer(id);

        return Response.noContent().build();
    }

    @PATCH
    @Path("/activate/{id}")
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response activateVolunteer(@PathParam("id") long id) {

        this.volunteerService.activateVolunteer(id);

        return Response.noContent().build();
    }
}
