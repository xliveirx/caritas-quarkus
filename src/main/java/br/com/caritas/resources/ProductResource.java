package br.com.caritas.resources;

import br.com.caritas.dto.donation.ClothesRequestDTO;
import br.com.caritas.dto.donation.FoodRequestDTO;
import br.com.caritas.service.ProductService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/products")
public class ProductResource {

    @Inject
    private ProductService productService;

    @GET
    @Authenticated
    @Path("/clothes")
    public Response getAllClothes(@QueryParam("page") @DefaultValue("0") int page,
                                   @QueryParam("size") @DefaultValue("10") int size) {

        var products = this.productService.getAllClothes(page, size);

        return Response.ok(products).build();
    }

    @GET
    @Authenticated
    @Path("/foods")
    public Response getAllFoods(@QueryParam("page") @DefaultValue("0") int page,
                                  @QueryParam("size") @DefaultValue("10") int size) {

        var products = this.productService.getAllFoods(page, size);

        return Response.ok(products).build();
    }

    @GET
    @Authenticated
    @Path("/clothes/{id}")
    public Response getClothesById(@PathParam("id") Long id) {

        var clothes = this.productService.getClothesById(id);

        return Response.ok(clothes).build();
    }

    @GET
    @Authenticated
    @Path("/foods/{id}")
    public Response getFoodById(@PathParam("id") Long id) {

        var food = this.productService.getFoodById(id);

        return Response.ok(food).build();
    }

    @POST
    @Authenticated
    @Path("/clothes")
    public Response createClothes(@Valid ClothesRequestDTO req) {

        var product = this.productService.createClothes(req);

        return Response.ok(product).build();
    }

    @POST
    @Authenticated
    @Path("/foods")
    public Response createFood(@Valid FoodRequestDTO req) {

        var food = this.productService.createFood(req);

        return Response.ok(food).build();
    }

    @PATCH
    @Authenticated
    @Path("/deactivate-product/{id}")
    public Response deactivateProduct(@PathParam("id") Long id) {

        this.productService.deactivateProduct(id);

        return Response.noContent().build();
    }

    @PATCH
    @Authenticated
    @Path("/activate-product/{id}")
    public Response activateProduct(@PathParam("id") Long id) {

        this.productService.activateProduct(id);

        return Response.noContent().build();
    }
}
