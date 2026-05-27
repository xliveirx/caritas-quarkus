package br.com.caritas.dao;

import br.com.caritas.entity.donation.DonationExitEntity;
import br.com.caritas.entity.donation.Status;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DonationExitDAO {

    public PanacheQuery<DonationExitEntity> findAll(int page, int size, Long parishId,
                                                     String search, Status status) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            conditions.add(
                "exists (select m from FamilyMemberEntity m where m.family = this.family " +
                "and lower(m.name) like :pattern)"
            );
            params.put("pattern", pattern);
        }

        if (status != null) {
            conditions.add("status = :status");
            params.put("status", status);
        }

        if (conditions.isEmpty()) {
            return DonationExitEntity.<DonationExitEntity>findAll(Sort.by("date").descending())
                    .page(Page.of(page, size));
        }
        return DonationExitEntity.<DonationExitEntity>find(
                String.join(" and ", conditions), Sort.by("date").descending(), params)
                .page(Page.of(page, size));
    }
}
