package br.com.caritas.dao;

import br.com.caritas.entity.config.AttributeType;
import br.com.caritas.entity.donation.ProductType;
import br.com.caritas.entity.donation.StockItemEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class StockItemDAO {

    public PanacheQuery<StockItemEntity> findClothes(int page, int size, Long parishId,
                                                      String search, String category,
                                                      String gender, String condition) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        conditions.add("product.type = :type");
        params.put("type", ProductType.CLOTHES);

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            conditions.add("lower(product.name) like :pattern");
            params.put("pattern", "%" + search.trim().toLowerCase() + "%");
        }

        if (category != null && !category.isBlank()) {
            conditions.add("exists (select a from AttributeEntity a where a member of treat(product as ClothesProductEntity).attributes and a.type = :catType and lower(a.label) = :category)");
            params.put("catType", AttributeType.CATEGORY);
            params.put("category", category.trim().toLowerCase());
        }

        if (gender != null && !gender.isBlank()) {
            conditions.add("exists (select a from AttributeEntity a where a member of treat(product as ClothesProductEntity).attributes and a.type = :genType and lower(a.label) = :gender)");
            params.put("genType", AttributeType.GENDER);
            params.put("gender", gender.trim().toLowerCase());
        }

        if (condition != null && !condition.isBlank()) {
            conditions.add("exists (select a from AttributeEntity a where a member of treat(product as ClothesProductEntity).attributes and a.type = :condType and lower(a.label) = :condition)");
            params.put("condType", AttributeType.CONDITION);
            params.put("condition", condition.trim().toLowerCase());
        }

        return StockItemEntity.<StockItemEntity>find(String.join(" and ", conditions), params)
                .page(Page.of(page, size));
    }

    public PanacheQuery<StockItemEntity> findFood(int page, int size, Long parishId,
                                                   String search, Boolean expired) {
        Map<String, Object> params = new HashMap<>();
        List<String> conditions = new ArrayList<>();

        conditions.add("product.type = :type");
        params.put("type", ProductType.FOOD);

        if (parishId != null) {
            conditions.add("parish.id = :parishId");
            params.put("parishId", parishId);
        }

        if (search != null && !search.isBlank()) {
            conditions.add("lower(product.name) like :pattern");
            params.put("pattern", "%" + search.trim().toLowerCase() + "%");
        }

        if (expired != null) {
            if (expired) {
                conditions.add("treat(product as FoodProductEntity).expirationDate < current_date");
            } else {
                conditions.add("treat(product as FoodProductEntity).expirationDate >= current_date");
            }
        }

        return StockItemEntity.<StockItemEntity>find(String.join(" and ", conditions), params)
                .page(Page.of(page, size));
    }
}
