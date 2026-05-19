package br.com.caritas.dto;

import java.util.List;

public record ApiListDTO<T> (List<T> data,
                             PaginationDTO pagination){
}
