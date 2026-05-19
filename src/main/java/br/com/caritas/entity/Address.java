package br.com.caritas.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class Address {
    public String street;
    public Integer number;
    public String complement;
    public String city;
    public String state;
    public String postalCode;
}
