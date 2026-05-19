package br.com.caritas.resources;

import br.com.caritas.dto.volunteer.VolunteerRequestDTO;
import br.com.caritas.dto.volunteer.VolunteerUpdateDTO;
import br.com.caritas.service.VolunteerService;
import jakarta.annotation.Resource;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/volunteers")
public class VolunteerResource {

    @Inject
    private JsonWebToken jwt;

    @Inject
    private VolunteerService volunteerService;


    @GET
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response getAllVolunteersByParishId(@QueryParam("page") @DefaultValue("0") int page,
                                               @QueryParam("size") @DefaultValue("10") int size,
                                               @QueryParam("parishId") Long parishId) {

        var volunteers = this.volunteerService.getAllVolunteersByParishId(page, size, parishId, jwt);

        return Response.ok(volunteers).build();
    }

    @GET
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    @Path("/{id}")
    public Response getVolunteerById(@PathParam("id") Long id) {

        var volunteer = this.volunteerService.getVolunteerById(id, jwt);

        return Response.ok(volunteer).build();
    }

    @POST
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response createVolunteer(@Valid VolunteerRequestDTO req) {

        var volunteer = this.volunteerService.createVolunteer(req, jwt);

        return Response.ok(volunteer).build();
    }

    @PUT
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    @Path("/{id}")
    public Response updateVolunteer(@PathParam("id") Long id,
                                    VolunteerUpdateDTO req){

        var volunteer = this.volunteerService.updateVolunteer(id, req, jwt);

        return Response.ok(volunteer).build();
    }

    @PATCH
    @Path("/deactivate/{id}")
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response deactivateVolunteer(@PathParam("id") long id) {

        this.volunteerService.deactivateVolunteer(id, jwt);

        return Response.noContent().build();
    }

    @PATCH
    @Path("/activate/{id}")
    @RolesAllowed({"COORDINATOR", "ADMIN"})
    public Response activateVolunteer(@PathParam("id") long id) {

        this.volunteerService.activateVolunteer(id, jwt);

        return Response.noContent().build();
    }
}
