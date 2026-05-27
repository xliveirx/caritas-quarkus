package br.com.caritas.entity.donation;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_clothes_products")
public class ClothesProductEntity extends ProductEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "size")
    public Size size;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    public Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    public Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false)
    public Condition condition;

}
