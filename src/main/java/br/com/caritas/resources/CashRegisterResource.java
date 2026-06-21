package br.com.caritas.resources;

import br.com.caritas.dto.parish.CashRegisterMovementRequestDTO;
import br.com.caritas.service.CashRegisterService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/cash-register")
public class CashRegisterResource {

    @Inject
    private CashRegisterService cashRegisterService;

    @GET
    @Authenticated
    public Response getCashRegister(@QueryParam("parishId") Long parishId) {

        var register = this.cashRegisterService.getCashRegister(parishId);

        return Response.ok(register).build();
    }

    @POST
    @Authenticated
    public Response createCashRegisterMovement(CashRegisterMovementRequestDTO req) {

        var movement = this.cashRegisterService.createCashRegisterMovement(req);

        return Response.ok(movement).build();
    }
}
