package br.com.caritas.service;

import br.com.caritas.dto.DashboardResponseDTO;
import br.com.caritas.dto.bazar.BazarSaleResponseDTO;
import br.com.caritas.dto.parish.CashRegisterResponseDTO;
import br.com.caritas.dto.visit.VisitResponseDTO;
import br.com.caritas.entity.bazar.BazarSaleEntity;
import br.com.caritas.entity.donation.DonationEntryEntity;
import br.com.caritas.entity.donation.DonationExitEntity;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.parish.CashRegisterEntity;
import br.com.caritas.entity.user.CoordinatorEntity;
import br.com.caritas.entity.user.VolunteerEntity;
import br.com.caritas.entity.visit.VisitEntity;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class DashboardService {

    @Inject
    private JwtParishContext parishContext;

    @Transactional
    public DashboardResponseDTO getDashboard(Long parishId) {

        Long resolvedParishId = this.parishContext.resolveParishId(parishId);

        int currentMonth = LocalDate.now().getMonthValue();

        long totalFamilies = FamilyEntity.count("parish.id = ?1", resolvedParishId);

        List<BazarSaleResponseDTO> recentSales = BazarSaleEntity.<BazarSaleEntity>find(
                "parish.id = ?1", Sort.by("soldAt").descending(), resolvedParishId)
                .page(Page.ofSize(5))
                .list()
                .stream()
                .map(BazarSaleResponseDTO::fromEntity)
                .toList();

        long totalMonthSales = BazarSaleEntity.count(
                "parish.id = ?1 and month(soldAt) = ?2", resolvedParishId, currentMonth);

        CashRegisterResponseDTO cashRegister = CashRegisterEntity.<CashRegisterEntity>find("parish.id = ?1", resolvedParishId)
                .firstResultOptional()
                .map(CashRegisterResponseDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Caixa não encontrado.",
                        "Caixa não encontrado para a paróquia com id " + resolvedParishId
                ));

        long totalDonationEntries = DonationEntryEntity.count("parish.id = ?1", resolvedParishId);

        long totalMonthDonationEntries = DonationEntryEntity.count(
                "parish.id = ?1 and month(date) = ?2", resolvedParishId, currentMonth);

        long totalDonationExits = DonationExitEntity.count("parish.id = ?1", resolvedParishId);

        long totalMonthDonationExits = DonationExitEntity.count(
                "parish.id = ?1 and month(date) = ?2", resolvedParishId, currentMonth);

        long totalParishCoordinators = CoordinatorEntity.count("parish.id = ?1 and active = ?2", resolvedParishId, Boolean.TRUE);

        long totalParishVolunteers = VolunteerEntity.count("parish.id = ?1 and active = ?2", resolvedParishId, Boolean.TRUE);

        List<VisitResponseDTO> lastVisits = VisitEntity.<VisitEntity>find(
                "parish.id = ?1", Sort.by("scheduledDate").descending(), resolvedParishId)
                .page(Page.ofSize(5))
                .list()
                .stream()
                .map(VisitResponseDTO::fromEntity)
                .toList();

        return new DashboardResponseDTO(
                totalFamilies,
                recentSales,
                totalMonthSales,
                cashRegister,
                totalDonationEntries,
                totalMonthDonationEntries,
                totalDonationExits,
                totalMonthDonationExits,
                totalParishCoordinators,
                totalParishVolunteers,
                lastVisits
        );
    }
}
