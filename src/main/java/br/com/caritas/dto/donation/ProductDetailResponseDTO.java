package br.com.caritas.dto.donation;

import br.com.caritas.entity.donation.*;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.time.LocalDate;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = ProductDetailResponseDTO.Clothes.class, name = "CLOTHES"),
        @JsonSubTypes.Type(value = ProductDetailResponseDTO.Food.class,    name = "FOOD"),
})
public sealed interface ProductDetailResponseDTO
        permits ProductDetailResponseDTO.Clothes, ProductDetailResponseDTO.Food {

    record Clothes (
            Long id,
            String name,
            String description,
            Boolean active,
            Size size,
            Category category,
            Gender gender,
            Condition condition,
            Unit defaultUnit
    ) implements ProductDetailResponseDTO {
        public static Clothes fromEntity(ClothesProductEntity entity) {
            return new Clothes(
                    entity.id,
                    entity.name,
                    entity.description,
                    entity.active,
                    entity.size,
                    entity.category,
                    entity.gender,
                    entity.condition,
                    entity.defaultUnit
            );
        }
    }

    record Food (
            Long id,
            String name,
            String batch,
            String description,
            Boolean active,
            LocalDate expirationDate,
            Unit defaultUnit
    ) implements ProductDetailResponseDTO {
        public static Food fromEntity (FoodProductEntity entity) {
            return new Food(
                    entity.id,
                    entity.name,
                    entity.batch,
                    entity.description,
                    entity.active,
                    entity.expirationDate,
                    entity.defaultUnit
            );
        }
    }
}
