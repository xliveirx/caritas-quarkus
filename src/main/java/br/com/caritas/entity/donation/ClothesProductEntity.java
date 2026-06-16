package br.com.caritas.entity.donation;

import br.com.caritas.entity.config.AttributeEntity;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "tbl_clothes_products")
public class ClothesProductEntity extends ProductEntity {

    @ManyToMany
    @JoinTable(
            name = "tbl_product_attributes",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "attribute_id"))
    public List<AttributeEntity> attributes;
}
