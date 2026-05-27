package br.com.caritas.dao;

import br.com.caritas.entity.donation.KitEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class KitDAO {

    public PanacheQuery<KitEntity> findAll(int page, int size, Long parishId,
                                            String search, Boolean active) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            conditions.add("lower(name) like :pattern");
            params.put("pattern", "%" + search.trim().toLowerCase() + "%");
        }

        if (active != null) {
            conditions.add("active = :active");
            params.put("active", active);
        }

        if (conditions.isEmpty()) {
            return KitEntity.<KitEntity>findAll(Sort.by("name")).page(Page.of(page, size));
        }
        return KitEntity.<KitEntity>find(String.join(" and ", conditions), Sort.by("name"), params)
                .page(Page.of(page, size));
    }
}
