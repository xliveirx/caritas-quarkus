package br.com.caritas.dto;

import br.com.caritas.dto.bazar.BazarSaleResponseDTO;
import br.com.caritas.dto.parish.CashRegisterResponseDTO;
import br.com.caritas.dto.visit.VisitResponseDTO;

import java.util.List;

public record DashboardResponseDTO(
        long totalFamilies,
        List<BazarSaleResponseDTO> recentSales,
        long totalMonthSales,
        CashRegisterResponseDTO cashRegister,
        long totalDonationEntries,
        long totalMonthDonationEntries,
        long totalDonationExits,
        long totalMonthDonationExits,
        long totalParishCoordinators,
        long totalParishVolunteers,
        List<VisitResponseDTO> lastVisits
) {
}
