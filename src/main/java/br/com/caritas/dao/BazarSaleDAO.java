package br.com.caritas.dao;

import br.com.caritas.entity.bazar.BazarSaleEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class BazarSaleDAO {

    public PanacheQuery<BazarSaleEntity> findAll(int page, int size, Long parishId,
                                                  String search,
                                                  LocalDate dateFrom, LocalDate dateTo,
                                                  BigDecimal minTotal, BigDecimal maxTotal) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            conditions.add("(lower(buyerName) like :search or lower(buyerCpf) like :search)");
            params.put("search", pattern);
        }

        if (dateFrom != null) {
            conditions.add("soldAt >= :dateFrom");
            params.put("dateFrom", dateFrom.atStartOfDay());
        }

        if (dateTo != null) {
            conditions.add("soldAt <= :dateTo");
            params.put("dateTo", dateTo.atTime(LocalTime.MAX));
        }

        if (minTotal != null) {
            conditions.add("total >= :minTotal");
            params.put("minTotal", minTotal);
        }

        if (maxTotal != null) {
            conditions.add("total <= :maxTotal");
            params.put("maxTotal", maxTotal);
        }

        if (conditions.isEmpty()) {
            return BazarSaleEntity.<BazarSaleEntity>findAll(Sort.by("soldAt").descending())
                    .page(Page.of(page, size));
        }
        return BazarSaleEntity.<BazarSaleEntity>find(
                String.join(" and ", conditions), Sort.by("soldAt").descending(), params)
                .page(Page.of(page, size));
    }
}
