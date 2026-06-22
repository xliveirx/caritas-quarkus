package br.com.caritas.resources;

import br.com.caritas.dto.visit.VisitRequestDTO;
import br.com.caritas.dto.visit.VisitUpdateDTO;
import br.com.caritas.entity.visit.VisitStatus;
import br.com.caritas.service.VisitService;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@ApplicationScoped
@Path("/api/v1/visits")
public class VisitResource {

    @Inject
    private VisitService visitService;

    @GET
    @Authenticated
    @Path("/family/{familyId}")
    public Response getAllVisitsByFamilyId(@QueryParam("page") @DefaultValue("0") int page,
                                          @QueryParam("size") @DefaultValue("10") int size,
                                          @PathParam("familyId") Long familyId) {

        var visits = this.visitService.getAllVisitsByFamilyId(familyId, page, size);

        return Response.ok(visits).build();
    }

    @GET
    @Authenticated
    @Path("/calendar")
    public Response getAllVisitsForCalendar(@QueryParam("month") int month,
                                           @QueryParam("year") int year,
                                           @QueryParam("parishId") Long parishId) {

        var visits = this.visitService.getAllVisitsForCalendar(month, year, parishId);

        return Response.ok(visits).build();
    }

    @POST
    @Authenticated
    public Response createVisit(@Valid VisitRequestDTO req) {

        var visit = this.visitService.createVisit(req);

        return Response
                .created(URI.create("/api/v1/visits/" + visit.id()))
                .entity(visit)
                .build();
    }

    @PUT
    @Authenticated
    @Path("/{id}")
    public Response updateVisit(@PathParam("id") Long id, @Valid VisitUpdateDTO req) {

        var visit = this.visitService.updateVisit(id, req);

        return Response.ok(visit).build();
    }

    @PATCH
    @Authenticated
    @Path("/conclude/{id}")
    public Response concludeVisit(@PathParam("id") Long id) {

        var visit = this.visitService.changeVisitStatus(id, VisitStatus.COMPLETED);

        return Response.ok(visit).build();
    }

    @PATCH
    @Authenticated
    @Path("/cancel/{id}")
    public Response cancelVisit(@PathParam("id") Long id) {

        var visit = this.visitService.changeVisitStatus(id, VisitStatus.CANCELED);

        return Response.ok(visit).build();
    }
}
