package br.com.caritas.resources;

import br.com.caritas.dto.family.FamilyRequestDTO;
import br.com.caritas.dto.family.FamilyUpdateDTO;
import br.com.caritas.entity.family.Situation;
import br.com.caritas.service.FamilyService;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.net.URI;

@ApplicationScoped
@Path("/api/v1/families")
public class FamilyResource {

    @Inject
    private FamilyService familyService;

    @GET
    @Authenticated
    public Response getAllFamilies(@QueryParam("page") @DefaultValue("0") int page,
                                   @QueryParam("size") @DefaultValue("10") int size,
                                   @QueryParam("search") String search,
                                   @QueryParam("parishId") Long parishId,
                                   @QueryParam("situation") Situation situation,
                                   @QueryParam("minIncome") BigDecimal minIncome,
                                   @QueryParam("maxIncome") BigDecimal maxIncome,
                                   @QueryParam("bolsaFamilia") Boolean bolsaFamilia) {

        var families = this.familyService.getAllFamilies(
                page, size, search, parishId, situation, minIncome, maxIncome, bolsaFamilia
        );

        return Response.ok(families).build();
    }

    @GET
    @Authenticated
    @Path("/{id}")
    public Response getFamilyById(@PathParam("id") Long id) {

        var family = this.familyService.getFamilyById(id);

        return Response.ok(family).build();
    }

    @POST
    @Authenticated
    public Response createFamily(@Valid FamilyRequestDTO req) {

        var family = this.familyService.createFamily(req);

        return Response
                .created(URI.create("/api/v1/families/" + family.id()))
                .entity(family)
                .build();
    }

    @PUT
    @Authenticated
    @Path("/{id}")
    public Response updateFamily(@PathParam("id") Long id,
                                 @Valid FamilyUpdateDTO req) {

        var family = this.familyService.updateFamily(req, id);

        return Response.ok(family).build();
    }

    @DELETE
    @Authenticated
    @Path("/{id}")
    public Response deleteFamily(@PathParam("id") Long id) {

        this.familyService.deleteFamily(id);

        return Response.noContent().build();
    }

}
