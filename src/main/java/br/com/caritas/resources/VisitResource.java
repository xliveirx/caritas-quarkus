package br.com.caritas.resources;

import br.com.caritas.dto.VisitRequestDTO;
import br.com.caritas.dto.VisitUpdateDTO;
import br.com.caritas.entity.VisitStatus;
import br.com.caritas.service.VisitService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/visits")
public class VisitResource {

    @Inject
    private VisitService visitService;

    @Inject
    private JsonWebToken jwt;

    @GET
    @Authenticated
    @Path("/family/{familyId}")
    public Response getAllVisitsByFamilyId(@QueryParam("page") @DefaultValue("0") int page,
                                           @QueryParam("size") @DefaultValue("10") int size,
                                           @PathParam("familyId") Long familyId) {

        var visits = this.visitService.getAllVisitsByFamilyId(familyId, page, size, jwt);

        return Response.ok(visits).build();
    }

    @POST
    @Authenticated
    public Response createVisit(@Valid VisitRequestDTO req) {

        var visit = this.visitService.createVisit(req, jwt);

        return Response.ok(visit).build();
    }

    @PUT
    @Authenticated
    @Path("/{id}")
    public Response updateVisit(@PathParam("id") Long id, @Valid VisitUpdateDTO req) {

        var visit = this.visitService.updateVisit(id, req, jwt);

        return Response.ok(visit).build();
    }

    @PATCH
    @Authenticated
    @Path("/conclude/{id}")
    public Response concludeVisit(@PathParam("id") Long id) {

        var visit = this.visitService.changeVisitStatus(id, jwt, VisitStatus.COMPLETED);

        return Response.ok(visit).build();
    }

    @PATCH
    @Authenticated
    @Path("/cancel/{id}")
    public Response cancelVisit(@PathParam("id") Long id) {

        var visit = this.visitService.changeVisitStatus(id, jwt, VisitStatus.CANCELED);

        return Response.ok(visit).build();
    }
}
