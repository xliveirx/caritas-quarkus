package br.com.caritas.resources;

import br.com.caritas.dto.donation.DonationEntryRequestDTO;
import br.com.caritas.service.DonationEntryService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Resource
@Path("/api/v1/donations/entries")
public class DonationEntryResource {

    @Inject
    private JsonWebToken jwt;

    @Inject
    private DonationEntryService donationEntryService;

    @GET
    @Authenticated
    public Response getAllDonationEntries(@QueryParam("page") @DefaultValue("0") int page,
                                          @QueryParam("size") @DefaultValue("10") int size) {

        var donations = this.donationEntryService.getAllDonationEntries(page, size, jwt);

        return Response.ok(donations).build();
    }

    @GET
    @Authenticated
    @Path("/{id}")
    public Response getDonationEntryById(@PathParam("id") Long id) {

        var donation = this.donationEntryService.getDonationEntryById(id, jwt);

        return Response.ok(donation).build();
    }

    @POST
    @Authenticated
    public Response createDonationEntry(DonationEntryRequestDTO req) {

        var donation = this.donationEntryService.createDonationEntry(req, jwt);

        return Response.ok(donation).build();

    }

    @PATCH
    @Authenticated
    @Path("/{id}")
    public Response cancelDonationEntry(@PathParam("id") Long id) {

        this.donationEntryService.cancelDonationEntry(id);

        return Response.noContent().build();
    }
}

