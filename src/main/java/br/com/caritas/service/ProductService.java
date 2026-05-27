package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.donation.*;
import br.com.caritas.entity.donation.*;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.Comparator;

@ApplicationScoped
public class ProductService {

    public ApiListDTO getAllClothes(int page, int size) {

        var query = ClothesProductEntity.<ClothesProductEntity>find(
                "active = ?1 and type = ?2", Boolean.TRUE, ProductType.CLOTHES)
                .page(Page.of(page, size));


        var clothes = query.list()
                .stream()
                .sorted(Comparator.comparing(c -> c.name))
                .map(ClothesResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                clothes,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public ApiListDTO getAllFoods(int page, int size) {

        var query = FoodProductEntity.<FoodProductEntity>find(
                        "active = ?1 and type = ?2", Boolean.TRUE, ProductType.FOOD)
                .page(Page.of(page, size));


        var foods = query.list()
                .stream()
                .sorted(Comparator.comparing(f -> f.name))
                .map(FoodResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                foods,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public ClothesResponseDTO getClothesById(Long id) {

        ClothesProductEntity clothes = ClothesProductEntity.<ClothesProductEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothes not found.",
                        "Clothes not found with id " + id
                ));

        return ClothesResponseDTO.fromEntity(clothes);
    }

    public FoodResponseDTO getFoodById(Long id) {

        FoodProductEntity food = FoodProductEntity.<FoodProductEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothes not found.",
                        "Clothes not found with id " + id
                ));

        return FoodResponseDTO.fromEntity(food);
    }


    @Transactional
    public ClothesResponseDTO createClothes(ClothesRequestDTO req) {

        ClothesProductEntity clothes = new ClothesProductEntity();

        clothes.name = req.name();
        clothes.description = req.description();
        clothes.size = req.size();
        clothes.category = req.category();
        clothes.gender = req.gender();
        clothes.condition = req.condition();
        clothes.active = Boolean.TRUE;
        clothes.type = ProductType.CLOTHES;
        clothes.defaultUnit = Unit.UNIDADES;

        clothes.persist();

        return ClothesResponseDTO.fromEntity(clothes);
    }

    @Transactional
    public FoodResponseDTO createFood(FoodRequestDTO req) {

        FoodProductEntity food = new FoodProductEntity();

        food.name = req.name();
        food.description = req.description();
        food.batch = req.batch();
        food.expirationDate = req.expirationDate();
        food.active = Boolean.TRUE;
        food.type = ProductType.FOOD;
        food.defaultUnit = req.defaultUnit();

        food.persist();

        return FoodResponseDTO.fromEntity(food);
    }

    @Transactional
    public void deactivateProduct(Long id) {

        ProductEntity product = ProductEntity.<ProductEntity>find("id = ?1 and active = ?2", id, Boolean.TRUE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found.",
                        "Product with id " + id + " not found."
                ));

        product.active = Boolean.FALSE;
        product.persist();
    }

    @Transactional
    public void activateProduct(Long id) {

        ProductEntity product = ProductEntity.<ProductEntity>find("id = ?1 and active = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found.",
                        "Product with id " + id + " not found."
                ));

        product.active = Boolean.TRUE;
        product.persist();
    }
}
