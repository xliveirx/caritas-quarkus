package br.com.caritas.dao;

import br.com.caritas.entity.donation.DonationEntryEntity;
import br.com.caritas.entity.donation.DonationStatus;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DonationEntryDAO {

    public PanacheQuery<DonationEntryEntity> findAll(int page, int size, Long parishId,
                                                      String search, DonationStatus donationStatus) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            conditions.add("lower(coalesce(donator,'')) like :pattern");
            params.put("pattern", "%" + search.trim().toLowerCase() + "%");
        }

        if (donationStatus != null) {
            conditions.add("status = :donationStatus");
            params.put("donationStatus", donationStatus);
        }

        if (conditions.isEmpty()) {
            return DonationEntryEntity.<DonationEntryEntity>findAll(Sort.by("date").descending())
                    .page(Page.of(page, size));
        }
        return DonationEntryEntity.<DonationEntryEntity>find(
                String.join(" and ", conditions), Sort.by("date").descending(), params)
                .page(Page.of(page, size));
    }
}
