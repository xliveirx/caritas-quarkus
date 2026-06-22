package br.com.caritas.resources;

import br.com.caritas.dto.bazar.BazarRequestDTO;
import br.com.caritas.service.BazarSaleService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;

@Path("/api/v1/bazar")
@Produces(MediaType.APPLICATION_JSON)
public class BazarSaleResource {

    @Inject
    BazarSaleService bazarSaleService;

    @GET
    @Authenticated
    public Response getAllBazarSales(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size,
            @QueryParam("parishId") Long parishId,
            @QueryParam("search") String search,
            @QueryParam("dateFrom") LocalDate dateFrom,
            @QueryParam("dateTo") LocalDate dateTo,
            @QueryParam("minTotal") BigDecimal minTotal,
            @QueryParam("maxTotal") BigDecimal maxTotal) {

        var sales = bazarSaleService.getAllBazarSales(
                page, size, parishId, search, dateFrom, dateTo, minTotal, maxTotal);

        return Response.ok(sales).build();
    }

    @GET
    @Authenticated
    @Path("/{id}")
    public Response getBazarSaleById(@PathParam("id") Long id) {

        var sale = this.bazarSaleService.getBazarSaleById(id);

        return Response.ok(sale).build();
    }

    @POST
    @Authenticated
    public Response createBazarSale(@Valid BazarRequestDTO req) {

        var sale = this.bazarSaleService.createBazarSale(req);

        return Response.created(URI.create("/api/v1/bazar/" + sale.id()))
                .entity(sale)
                .build();
    }
}
