package br.com.caritas.dao;

import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.family.Situation;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class FamilyDAO {

    public PanacheQuery<FamilyEntity> findAll(int page, int size, Long parishId,
                                               String search, Situation situation,
                                               BigDecimal minIncome, BigDecimal maxIncome,
                                               Boolean bolsaFamilia) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        if (parishId != null) {
            conditions.add("parish.id = :parish and parish.isDiocese = :isDiocese");
            params.put("parish", parishId);
            params.put("isDiocese", Boolean.FALSE);
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            conditions.add(
                "(lower(coalesce(observation,'')) like :pattern " +
                "or exists (select m from FamilyMemberEntity m where m.family = this " +
                "and (lower(m.name) like :pattern " +
                "or lower(coalesce(m.cpf,'')) like :pattern " +
                "or lower(coalesce(m.motherName,'')) like :pattern)))"
            );
            params.put("pattern", pattern);
        }

        if (situation != null) {
            conditions.add("situation = :situation");
            params.put("situation", situation);
        }

        if (minIncome != null) {
            conditions.add("monthlyIncome >= :minIncome");
            params.put("minIncome", minIncome);
        }

        if (maxIncome != null) {
            conditions.add("monthlyIncome <= :maxIncome");
            params.put("maxIncome", maxIncome);
        }

        if (bolsaFamilia != null) {
            conditions.add("bolsaFamilia = :bolsaFamilia");
            params.put("bolsaFamilia", bolsaFamilia);
        }

        if (conditions.isEmpty()) {
            return FamilyEntity.<FamilyEntity>findAll().page(Page.of(page, size));
        }
        return FamilyEntity.<FamilyEntity>find(String.join(" and ", conditions), params)
                .page(Page.of(page, size));
    }
}
