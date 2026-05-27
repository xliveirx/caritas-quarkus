package br.com.caritas.dao;

import br.com.caritas.entity.parish.ParishEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ParishDAO {

    public PanacheQuery<ParishEntity> findAll(int page, int size, String search) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        conditions.add("isDiocese = :isDiocese");
        params.put("isDiocese", Boolean.FALSE);

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            conditions.add("(lower(name) like :pattern or lower(coalesce(cnpj,'')) like :pattern)");
            params.put("pattern", pattern);
        }

        return ParishEntity.<ParishEntity>find(String.join(" and ", conditions), Sort.by("name"), params)
                .page(Page.of(page, size));
    }
}
