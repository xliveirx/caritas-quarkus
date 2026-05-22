package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.ClothesStockItemResponseDTO;
import br.com.caritas.dto.donation.FoodStockItemResponseDTO;
import br.com.caritas.entity.donation.ProductType;
import br.com.caritas.entity.donation.StockItemEntity;
import br.com.caritas.entity.user.Roles;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Comparator;

@ApplicationScoped
public class StockItemService {

    public ApiListDTO getAllClothesStockItems(JsonWebToken jwt, int page, int size) {

        var groups = jwt.getGroups();
        PanacheQuery<StockItemEntity> query;

        if(groups.contains(Roles.ADMIN.name())) {
            query = StockItemEntity.find(
                    "product.type = ?1", ProductType.CLOTHES)
                    .page(Page.of(page, size));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            query = StockItemEntity.find(
                    "parish.id = ?1 and product.type = ?2", parishId, ProductType.CLOTHES)
                    .page(Page.of(page, size));
        }

        var stockItems = query.list()
                .stream()
                .sorted(Comparator.comparing(s -> s.product.name))
                .map(ClothesStockItemResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                stockItems,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public ApiListDTO getAllFoodStockItems(JsonWebToken jwt, int page, int size) {

        var groups = jwt.getGroups();
        PanacheQuery<StockItemEntity> query;

        if(groups.contains(Roles.ADMIN.name())) {
            query = StockItemEntity.find(
                            "product.type = ?1", ProductType.FOOD)
                    .page(Page.of(page, size));
        } else {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());
            query = StockItemEntity.find(
                            "parish.id = ?1 and product.type = ?2", parishId, ProductType.FOOD)
                    .page(Page.of(page, size));
        }

        var stockItems = query.list()
                .stream()
                .sorted(Comparator.comparing(s -> s.product.name))
                .map(FoodStockItemResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                stockItems,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }
}
