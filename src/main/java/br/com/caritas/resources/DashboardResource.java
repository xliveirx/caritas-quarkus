package br.com.caritas.resources;

import br.com.caritas.service.DashboardService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.Resource;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;

@Resource
@Path("/api/v1/dashboard")
public class DashboardResource {

    @Inject
    private DashboardService dashboardService;

    @GET
    @Authenticated
    public Response getDashboard(@QueryParam("parishId") Long parishId) {

        var dashboard = this.dashboardService.getDashboard(parishId);

        return Response.ok(dashboard).build();
    }
}
