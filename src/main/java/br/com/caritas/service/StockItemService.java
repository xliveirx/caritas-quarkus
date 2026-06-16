package br.com.caritas.service;

import br.com.caritas.dao.StockItemDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.ClothesStockItemResponseDTO;
import br.com.caritas.dto.donation.FoodStockItemResponseDTO;
import br.com.caritas.util.JwtParishContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;

@ApplicationScoped
public class StockItemService {

    @Inject
    private StockItemDAO stockItemDAO;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllClothesStockItems(int page, int size,
                                             String search, String category,
                                             String gender, String condition, Long parishId) {

        parishId = parishContext.resolveParishId(parishId);

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

    public ApiListDTO getAllFoodStockItems(int page, int size,
                                          String search, Boolean expired) {

        Long parishId = parishContext.resolveParishId(null);

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
