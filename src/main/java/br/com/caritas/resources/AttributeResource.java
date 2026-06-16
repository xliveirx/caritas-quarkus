package br.com.caritas.resources;

import br.com.caritas.dto.config.AttributeRequestDTO;
import br.com.caritas.dto.config.ReorderAttributesDTO;
import br.com.caritas.entity.config.AttributeType;
import br.com.caritas.service.AttributeService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/attributes")
public class AttributeResource {

    @Inject
    private AttributeService attributeService;

    @GET
    @Authenticated
    @Path("/{attributeType}")
    public Response getAllAttributes(@QueryParam("page") @DefaultValue("0") int page,
                                     @QueryParam("size") @DefaultValue("10") int size,
                                     @PathParam("attributeType")AttributeType attributeType) {

        var attributes = this.attributeService.getAllAttributes(page, size, attributeType);

        return Response.ok(attributes).build();
    }

    @POST
    @Authenticated
    public Response createAttribute(@Valid AttributeRequestDTO req) {

        var attribute = this.attributeService.createAttribute(req);

        return Response.ok(attribute).build();
    }

    @PUT
    @Authenticated
    @Path("/reorder")
    public Response reorderAttributes(@Valid ReorderAttributesDTO req) {

        this.attributeService.reorderAttributes(req);

        return Response.noContent().build();
    }

    @DELETE
    @Authenticated
    @Path("/{id}")
    public Response deleteAttribute(@PathParam("id") Long id) {

        this.attributeService.deleteAttribute(id);

        return Response.noContent().build();
    }
}
