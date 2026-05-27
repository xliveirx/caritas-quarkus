package br.com.caritas.dao;

import br.com.caritas.entity.donation.Category;
import br.com.caritas.entity.donation.Condition;
import br.com.caritas.entity.donation.Gender;
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
                                                      String search, Category category,
                                                      Gender gender, Condition condition) {
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

        if (category != null) {
            conditions.add("treat(product as ClothesProductEntity).category = :category");
            params.put("category", category);
        }

        if (gender != null) {
            conditions.add("treat(product as ClothesProductEntity).gender = :gender");
            params.put("gender", gender);
        }

        if (condition != null) {
            conditions.add("treat(product as ClothesProductEntity).condition = :condition");
            params.put("condition", condition);
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
