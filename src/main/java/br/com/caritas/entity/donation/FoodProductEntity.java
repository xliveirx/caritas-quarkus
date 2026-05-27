package br.com.caritas.entity.donation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "tbl_food_products")
public class FoodProductEntity extends ProductEntity {

    @Column(name = "batch")
    public String batch;

    @Column(name = "expiration_date", nullable = false)
    public LocalDate expirationDate;
}
