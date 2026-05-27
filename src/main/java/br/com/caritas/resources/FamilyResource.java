package br.com.caritas.resources;

import br.com.caritas.dto.family.FamilyRequestDTO;
import br.com.caritas.dto.family.FamilyUpdateDTO;
import br.com.caritas.entity.family.Situation;
import br.com.caritas.service.FamilyService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;

@Resource
@Path("/api/v1/families")
public class FamilyResource {

    @Inject
    private FamilyService familyService;

    @Inject
    private JsonWebToken jwt;

    @GET
    @Authenticated
    public Response getAllFamilies(@QueryParam("page") @DefaultValue("0") int page,
                                   @QueryParam("size") @DefaultValue("10") int size,
                                   @QueryParam("search") String search,
                                   @QueryParam("situation") Situation situation,
                                   @QueryParam("minIncome") BigDecimal minIncome,
                                   @QueryParam("maxIncome") BigDecimal maxIncome,
                                   @QueryParam("bolsaFamilia") Boolean bolsaFamilia) {

        var families = this.familyService.getAllFamilies(
                page, size, search, situation, minIncome, maxIncome, bolsaFamilia, jwt
        );

        return Response.ok(families).build();
    }

    @GET
    @Authenticated
    @Path("/{id}")
    public Response getFamilyById(@PathParam("id") Long id) {

        var family = this.familyService.getFamilyById(id, jwt);

        return Response.ok(family).build();
    }

    @POST
    @Authenticated
    public Response createFamily(@Valid FamilyRequestDTO req) {

        var family = this.familyService.createFamily(req, jwt);


        return Response.ok(family).build();
    }

    @PUT
    @Authenticated
    @Path("/{id}")
    public Response updateFamily(@PathParam("id") Long id,
                                 @Valid FamilyUpdateDTO req) {

        var family = this.familyService.updateFamily(req, id, jwt);

        return Response.ok(family).build();
    }

    @DELETE
    @Path("/{id}")
    @Authenticated
    public Response deleteFamily(@PathParam("id") Long id) {

        this.familyService.deleteFamily(id, jwt);

        return Response.ok().build();
    }
}
