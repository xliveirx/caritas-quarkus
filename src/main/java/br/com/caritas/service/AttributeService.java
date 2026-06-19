package br.com.caritas.service;

import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.config.AttributeRequestDTO;
import br.com.caritas.dto.config.AttributeResponseDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.config.ReorderAttributesDTO;
import br.com.caritas.entity.config.AttributeEntity;
import br.com.caritas.entity.config.AttributeType;
import br.com.caritas.entity.donation.ProductEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AttributeService {

    public ApiListDTO getAllAttributes(int page, int size, AttributeType attributeType) {

        var query = AttributeEntity.<AttributeEntity>find(
                        "SELECT e FROM AttributeEntity e WHERE e.type = ?1 ORDER BY COALESCE(e.position, 9999) ASC, e.label ASC",
                        attributeType)
                .page(Page.of(page, size));

        var attributes = query.list()
                .stream()
                .map(AttributeResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                attributes,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    @Transactional
    public AttributeResponseDTO createAttribute(AttributeRequestDTO req) {

        if (AttributeEntity.find(
                "type = ?1 and label = ?2", req.type(), req.label()).firstResultOptional().isPresent()) {
            throw new BusinessRuleException(
                    "Erro ao criar atributo.",
                    "Já existe um atributo com o mesmo tipo e rótulo.");
        }

        long count = AttributeEntity.count("type = ?1", req.type());

        AttributeEntity attribute = new AttributeEntity();
        attribute.type = req.type();
        attribute.label = req.label();
        attribute.position = (int) count;
        attribute.persist();

        return AttributeResponseDTO.fromEntity(attribute);
    }

    @Transactional
    public void reorderAttributes(ReorderAttributesDTO req) {

        for (int i = 0; i < req.ids().size(); i++) {
            AttributeEntity attr = AttributeEntity.findById(req.ids().get(i));
            if (attr != null) {
                attr.position = i;
            }
        }
    }

    @Transactional
    public void deleteAttribute(Long id) {

        AttributeEntity attribute = AttributeEntity.<AttributeEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Atributo não encontrado.",
                        "Não existe um atributo com o ID fornecido."));

        if (ProductEntity.find("SELECT p FROM ProductEntity p JOIN p.attributes a WHERE a.id = ?1", id)
                .firstResultOptional()
                .isPresent()) {
            throw new BusinessRuleException(
                    "Erro ao excluir atributo.",
                    "Não é possível excluir um atributo que está associado a um produto.");
        }

        attribute.delete();
    }
}
