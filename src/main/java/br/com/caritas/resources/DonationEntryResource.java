package br.com.caritas.resources;

import br.com.caritas.dto.donation.DonationEntryRequestDTO;
import br.com.caritas.entity.donation.DonationStatus;
import br.com.caritas.service.DonationEntryService;
import io.quarkus.security.Authenticated;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import java.net.URI;

@ApplicationScoped
@Path("/api/v1/donations/entries")
public class DonationEntryResource {

    @Inject
    private DonationEntryService donationEntryService;

    @GET
    @Authenticated
    public Response getAllDonationEntries(@QueryParam("page") @DefaultValue("0") int page,
                                         @QueryParam("size") @DefaultValue("10") int size,
                                         @QueryParam("search") String search,
                                         @QueryParam("status") DonationStatus donationStatus) {

        var donations = this.donationEntryService.getAllDonationEntries(page, size, search, donationStatus);

        return Response.ok(donations).build();
    }

    @POST
    @Authenticated
    public Response createDonationEntry(@Valid DonationEntryRequestDTO req) {

        var donation = this.donationEntryService.createDonationEntry(req);

        return Response
                .created(URI.create("/api/v1/donations/entries/" + donation.id()))
                .entity(donation)
                .build();
    }

    @PATCH
    @Authenticated
    @Path("/{id}")
    public Response cancelDonationEntry(@PathParam("id") Long id) {

        this.donationEntryService.cancelDonationEntry(id);

        return Response.noContent().build();
    }
}
