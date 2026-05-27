package br.com.caritas.dao;

import br.com.caritas.entity.user.VolunteerEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class VolunteerDAO {

    public PanacheQuery<VolunteerEntity> findByParish(int page, int size, Long parishId,
                                                       String search, Boolean active) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        conditions.add("parish.id = :parishId");
        params.put("parishId", parishId);

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            conditions.add("(lower(name) like :pattern or lower(coalesce(email,'')) like :pattern)");
            params.put("pattern", pattern);
        }

        if (active != null) {
            conditions.add("active = :active");
            params.put("active", active);
        }

        return VolunteerEntity.<VolunteerEntity>find(String.join(" and ", conditions), params)
                .page(Page.of(page, size));
    }
}
