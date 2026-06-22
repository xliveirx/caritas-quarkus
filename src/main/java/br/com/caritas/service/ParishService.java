package br.com.caritas.service;

import br.com.caritas.dao.ParishDAO;
import br.com.caritas.dto.*;
import br.com.caritas.dto.parish.ParishRequestDTO;
import br.com.caritas.dto.parish.ParishResponseDTO;
import br.com.caritas.dto.parish.ParishUpdateDTO;
import br.com.caritas.entity.Address;
import br.com.caritas.entity.parish.CashRegisterEntity;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.CaritasUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@ApplicationScoped
public class ParishService {

    @Inject
    private ParishDAO parishDAO;

    public ApiListDTO getAllParishes(int page, int size, String search) {

        var query = parishDAO.findAll(page, size, search);

        var parishes = query.list()
                .stream()
                .map(ParishResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(parishes, new PaginationDTO(page, size, query.pageCount(), query.count()));

    }

    public ParishResponseDTO getParishById(Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paróquia não encontrada.",
                        "Paróquia não encontrada com id " + id));


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
                    "CNPJ inválido",
                    "O CNPJ informado não é válido.");
        }

        parish.cnpj = req.cnpj();
        parish.address = address;
        parish.createdAt = LocalDateTime.now();
        parish.updatedAt = LocalDateTime.now();
        parish.persist();

        CashRegisterEntity cashRegister = new CashRegisterEntity();
        cashRegister.parish = parish;
        cashRegister.balance = BigDecimal.ZERO;
        cashRegister.persist();

        return ParishResponseDTO.fromEntity(parish);
    }

    @Transactional
    public ParishResponseDTO updateParish(@Valid ParishUpdateDTO req, Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paróquia não encontrada.",
                        "Paróquia não encontrada com id " + id));

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
                    "CNPJ inválido",
                    "O CNPJ informado não é válido.");
        }

        if(req.cnpj() != null){
            parish.cnpj = req.cnpj();

        }

        parish.updatedAt = LocalDateTime.now();
        parish.persist();
        return ParishResponseDTO.fromEntity(parish);
    }

    @Transactional
    public void deleteParish(Long id) {

        ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", id, Boolean.FALSE)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paróquia não encontrada.",
                        "Paróquia não encontrada com id " + id));

        parish.delete();
    }
}
