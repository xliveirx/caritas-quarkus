package br.com.caritas.service;

import br.com.caritas.dao.StockItemDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.ClothesStockItemResponseDTO;
import br.com.caritas.dto.donation.FoodStockItemResponseDTO;
import br.com.caritas.entity.donation.Category;
import br.com.caritas.entity.donation.Condition;
import br.com.caritas.entity.donation.Gender;
import br.com.caritas.entity.user.Roles;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Comparator;

@ApplicationScoped
public class StockItemService {

    @Inject
    private StockItemDAO stockItemDAO;

    public ApiListDTO getAllClothesStockItems(JsonWebToken jwt, int page, int size,
                                              String search, Category category,
                                              Gender gender, Condition condition) {
        var groups = jwt.getGroups();
        Long parishId = groups.contains(Roles.ADMIN.name()) ? null
                : Long.valueOf(jwt.getClaim("parish").toString());

        var query = stockItemDAO.findClothes(page, size, parishId, search, category, gender, condition);

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

    public ApiListDTO getAllFoodStockItems(JsonWebToken jwt, int page, int size,
                                           String search, Boolean expired) {
        var groups = jwt.getGroups();
        Long parishId = groups.contains(Roles.ADMIN.name()) ? null
                : Long.valueOf(jwt.getClaim("parish").toString());

        var query = stockItemDAO.findFood(page, size, parishId, search, expired);

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
