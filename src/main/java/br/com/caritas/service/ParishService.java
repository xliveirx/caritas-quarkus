package br.com.caritas.service;

import br.com.caritas.dto.*;
import br.com.caritas.dto.parish.ParishRequestDTO;
import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.dto.parish.ParishUpdateDTO;
import br.com.caritas.entity.Address;
import br.com.caritas.entity.ParishEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.CaritasUtil;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

@ApplicationScoped
public class ParishService {

    public ApiListDTO getAllParishes(int page, int size) {

        var query = ParishEntity.<ParishEntity>findAll()
                .page(Page.of(page, size));

        var parishes = query.list()
                .stream()
                .map(ParishResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(parishes, new PaginationDTO(page, size, query.pageCount(), query.count()));

    }

    public ParishResponseDTO getParishById(Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish with id " + id + " not found."));


        return ParishResponseDTO.fromEntity(parish);
    }

    @Transactional
    public ParishResponseDTO createParish(ParishRequestDTO req) {

        ParishEntity parish = new ParishEntity();

        parish.name = req.name();

        Address address = new Address();
        address.street = req.address().street();
        address.number = req.address().number();
        address.complement = req.address().complement();
        address.city = req.address().city();
        address.state = req.address().state();
        address.postalCode = req.address().postalCode();

        if(!CaritasUtil.isCnpjValid(req.cnpj())) {
            throw new BusinessRuleException(
                    "CNPJ is invalid",
                    "The informed format of the CNPJ is not valid.");
        }

        parish.cnpj = req.cnpj();
        parish.address = address;
        parish.persist();

        return ParishResponseDTO.fromEntity(parish);
    }

    @Transactional
    public ParishResponseDTO updateParish(@Valid ParishUpdateDTO req, Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish with id " + id + " not found."));

        if(req.name() != null) {
            parish.name = req.name();
        }

        if (req.address() != null) {
            if (req.address().street() != null) {
                parish.address.street = req.address().street();
            }
            if (req.address().number() != null) {
                parish.address.number = req.address().number();
            }
            if (req.address().city() != null) {
                parish.address.city = req.address().city();
            }
            if (req.address().state() != null) {
                parish.address.state = req.address().state();
            }
            if (req.address().postalCode() != null) {
                parish.address.postalCode = req.address().postalCode();
            }
        }

        if(req.cnpj() != null && !CaritasUtil.isCnpjValid(req.cnpj())) {
            throw new BusinessRuleException(
                    "CNPJ is invalid",
                    "The informed format of the CNPJ is not valid.");
        }

        if(req.cnpj() != null){
            parish.cnpj = req.cnpj();

        }

        parish.persist();
        return ParishResponseDTO.fromEntity(parish);
    }

    @Transactional
    public void deleteParish(Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parish not found.",
                        "Parish with id " + id + " not found."));

        parish.delete();
    }
}
