package br.com.caritas.resources;

import br.com.caritas.dto.donation.DonationExitRequestDTO;
import br.com.caritas.entity.donation.Status;
import br.com.caritas.service.DonationExitService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/donations/exits")
public class DonationExitResource {

    @Inject
    private JsonWebToken jwt;

    @Inject
    private DonationExitService donationExitService;

    @GET
    @Authenticated
    public Response getAllDonationExits(@QueryParam("page") @DefaultValue("0") int page,
                                        @QueryParam("size") @DefaultValue("10") int size,
                                        @QueryParam("search") String search,
                                        @QueryParam("status") Status status) {

        var donations = this.donationExitService.getAllDonationExits(page, size, search, status, jwt);

        return Response.ok(donations).build();
    }

    @POST
    @Authenticated
    public Response createDonationExit(DonationExitRequestDTO req) {

        var donation = this.donationExitService.createDonationExit(req, jwt);

        return Response.ok(donation).build();
    }

    @PATCH
    @Authenticated
    @Path("/{id}")
    public Response cancelDonationExit(@PathParam("id") Long id) {

        this.donationExitService.cancelDonationExit(id, jwt);

        return Response.noContent().build();
    }
}
