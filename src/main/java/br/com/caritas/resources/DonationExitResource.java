package br.com.caritas.resources;

import br.com.caritas.dto.donation.DonationExitRequestDTO;
import br.com.caritas.entity.donation.DonationStatus;
import br.com.caritas.service.DonationExitService;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@ApplicationScoped
@Path("/api/v1/donations/exits")
public class DonationExitResource {

    @Inject
    private DonationExitService donationExitService;

    @GET
    @Authenticated
    public Response getAllDonationExits(@QueryParam("page") @DefaultValue("0") int page,
                                       @QueryParam("size") @DefaultValue("10") int size,
                                       @QueryParam("search") String search,
                                       @QueryParam("status") DonationStatus donationStatus) {

        var donations = this.donationExitService.getAllDonationExits(page, size, search, donationStatus);

        return Response.ok(donations).build();
    }

    @POST
    @Authenticated
    public Response createDonationExit(@Valid DonationExitRequestDTO req) {

        var donation = this.donationExitService.createDonationExit(req);

        return Response
                .created(URI.create("/api/v1/donations/exits/" + donation.id()))
                .entity(donation)
                .build();
    }

    @PATCH
    @Authenticated
    @Path("/{id}")
    public Response cancelDonationExit(@PathParam("id") Long id) {

        this.donationExitService.cancelDonationExit(id);

        return Response.noContent().build();
    }
}
