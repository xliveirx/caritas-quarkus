package br.com.caritas.resources;

import br.com.caritas.entity.donation.Category;
import br.com.caritas.entity.donation.Condition;
import br.com.caritas.entity.donation.Gender;
import br.com.caritas.service.StockItemService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/stock")
public class StockItemResources {

    @Inject
    private JsonWebToken jwt;

    @Inject
    private StockItemService stockItemService;

    @GET
    @Authenticated
    @Path("/clothes")
    public Response getAllClothesStockItems(@QueryParam("page") @DefaultValue("0") int page,
                                            @QueryParam("size") @DefaultValue("10") int size,
                                            @QueryParam("search") String search,
                                            @QueryParam("category") Category category,
                                            @QueryParam("gender") Gender gender,
                                            @QueryParam("condition") Condition condition) {

        var stockItems = this.stockItemService.getAllClothesStockItems(jwt, page, size, search, category, gender, condition);

        return Response.ok(stockItems).build();
    }

    @GET
    @Authenticated
    @Path("/foods")
    public Response getAllFoodStockItems(@QueryParam("page") @DefaultValue("0") int page,
                                         @QueryParam("size") @DefaultValue("10") int size,
                                         @QueryParam("search") String search,
                                         @QueryParam("expired") Boolean expired) {

        var stockItems = this.stockItemService.getAllFoodStockItems(jwt, page, size, search, expired);

        return Response.ok(stockItems).build();
    }
}
