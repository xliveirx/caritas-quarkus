package br.com.caritas.service;

import br.com.caritas.dao.FamilyDAO;
import br.com.caritas.dto.*;
import br.com.caritas.dto.family.FamilyMemberRequestDTO;
import br.com.caritas.dto.family.FamilyRequestDTO;
import br.com.caritas.dto.family.FamilyResponseDTO;
import br.com.caritas.dto.family.FamilyUpdateDTO;
import br.com.caritas.entity.*;
import br.com.caritas.entity.family.FamilyEntity;
import br.com.caritas.entity.family.FamilyMemberEntity;
import br.com.caritas.entity.family.Situation;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.CaritasUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class FamilyService {

    @Inject
    private FamilyDAO familyDAO;

    public ApiListDTO getAllFamilies(int page, int size, String search,
                                     Situation situation,
                                     BigDecimal minIncome, BigDecimal maxIncome,
                                     Boolean bolsaFamilia,
                                     JsonWebToken jwt) {
        var groups = jwt.getGroups();
        Long parishId = null;
        if (groups.contains(Roles.COORDINATOR.name()) || groups.contains(Roles.VOLUNTEER.name())) {
            parishId = Long.valueOf(jwt.getClaim("parish").toString());
        }

        var query = familyDAO.findAll(page, size, parishId, search, situation, minIncome, maxIncome, bolsaFamilia);

        var families = query.list()
                .stream()
                .sorted(Comparator.comparing(f -> {
                    var member = f.members.stream().filter(m -> m.responsible).findFirst();
                    return member.map(m -> m.name).orElse("");
                }))
                .map(FamilyResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(families,
                new PaginationDTO(page, size, query.pageCount(), query.count()));
    }


    public FamilyResponseDTO getFamilyById(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        FamilyEntity family;
        if (groups.contains(Roles.ADMIN.name())) {
            family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                                    "Family not found.",
                                    "Family with id " + id + " not found."
                            )
                    );
        } else {
            family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .filter(f -> f.parish.id.equals(Long.valueOf(jwt.getClaim("parish").toString())) &&
                            f.parish.isDiocese.equals(Boolean.FALSE))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family with id " + id + " not found."
                    ));
        }

        return FamilyResponseDTO.fromEntity(family);
    }

    @Transactional
    public FamilyResponseDTO createFamily(FamilyRequestDTO req, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        FamilyEntity family = new FamilyEntity();
        List<FamilyMemberEntity> members = new ArrayList<>();

        long responsibleCount = req.members()
                .stream()
                .filter(FamilyMemberRequestDTO::responsible)
                .count();

        if (responsibleCount == 0) {
            throw new BusinessRuleException(
                    "No responsible.",
                    "There must be at least one responsible in the family.");
        }

        if (responsibleCount > 1) {
            throw new BusinessRuleException(
                    "Multiple responsibles.",
                    "There must be at most one responsible in the family.");
        }

        family.monthlyIncome = req.monthlyIncome();
        family.bolsaFamilia = req.bolsaFamilia();
        family.situation = req.situation();
        family.observation = req.observation();

        if (req.address() != null) {
            Address address = new Address();
            address.street = req.address().street();
            address.number = req.address().number();
            address.complement = req.address().complement();
            address.city = req.address().city();
            address.state = req.address().state();
            address.postalCode = req.address().postalCode();
            family.address = address;
        }

        if (groups.contains(Roles.COORDINATOR.name()) || groups.contains(Roles.VOLUNTEER.name())) {
            Long parishId = Long.valueOf(jwt.getClaim("parish").toString());

            ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", parishId, Boolean.FALSE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish with id " + parishId + " not found."));

            family.parish = parish;
        } else {

            if (req.parishId() == null) {
                throw new BusinessRuleException("Parish ID required.", "Admins must inform a parish ID.");
            }

            ParishEntity parish = ParishEntity.<ParishEntity>find("id = ?1 and isDiocese = ?2", req.parishId(), Boolean.FALSE)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parish not found.",
                            "Parish with id " + req.parishId() + " not found."));

            family.parish = parish;

        }

        req.members().forEach(m -> {
            FamilyMemberEntity member = new FamilyMemberEntity();
            member.name = m.name();

            if (m.cpf() != null && !CaritasUtil.isCpfValid(m.cpf())) {
                throw new BusinessRuleException(
                        "Invalid CPF.",
                        "The CPF " + m.cpf() + " is not valid.");
            }
            member.cpf = m.cpf();
            member.birthDate = m.birthDate();
            member.motherName = m.motherName();
            member.responsible = m.responsible();
            member.family = family;
            members.add(member);
        });

        family.members = members;
        family.persist();
        return FamilyResponseDTO.fromEntity(family);
    }

    @Transactional
    public FamilyResponseDTO updateFamily(FamilyUpdateDTO req, Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();
        FamilyEntity family;

        if (groups.contains(Roles.ADMIN.name())) {

            family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family with id " + id + " not found."));
        } else {

            family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .filter(f -> f.parish.id.equals(Long.valueOf(jwt.getClaim("parish").toString())) &&
                            f.parish.isDiocese.equals(Boolean.FALSE))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family with id " + id + " not found in your parish."));
        }

        if (req.monthlyIncome() != null) {
            family.monthlyIncome = req.monthlyIncome();
        }

        if (req.bolsaFamilia() != null) {
            family.bolsaFamilia = req.bolsaFamilia();
        }

        if (req.situation() != null) {
            family.situation = req.situation();
        }

        if (req.observation() != null) {
            family.observation = req.observation();
        }

        if (req.address() != null) {
            if (family.address == null) {
                family.address = new Address();
            }

            if (req.address().street() != null) {
                family.address.street = req.address().street();
            }
            if (req.address().number() != null) {
                family.address.number = req.address().number();
            }
            if (req.address().complement() != null) {
                family.address.complement = req.address().complement();
            }

            if (req.address().city() != null) {
                family.address.city = req.address().city();
            }
            if (req.address().state() != null) {
                family.address.state = req.address().state();
            }
            if (req.address().postalCode() != null) {
                family.address.postalCode = req.address().postalCode();
            }
        }

        if (req.members() != null) {
            req.members().forEach(m -> {

                if (m.id() == null) {
                    // membro novo — adiciona
                    FamilyMemberEntity member = new FamilyMemberEntity();
                    member.name = m.name();

                    if (m.cpf() != null && !CaritasUtil.isCpfValid(m.cpf())) {
                        throw new BusinessRuleException(
                                "Invalid CPF.",
                                "The CPF " + m.cpf() + " is not valid."
                        );
                    }

                    member.cpf = m.cpf();
                    member.birthDate = m.birthDate();
                    member.motherName = m.motherName();
                    member.responsible = m.responsible();
                    member.family = family;
                    family.members.add(member);

                } else {
                    // membro existente — atualiza pelo id
                    family.members.stream()
                            .filter(member -> member.id.equals(m.id()))
                            .findFirst()
                            .ifPresent(member -> {
                                if (m.name() != null) member.name = m.name();

                                if (m.cpf() != null && !CaritasUtil.isCpfValid(m.cpf())) {
                                    throw new BusinessRuleException(
                                            "Invalid CPF.",
                                            "The CPF " + m.cpf() + " is not valid."
                                    );
                                }
                                member.cpf = m.cpf();
                                member.birthDate = m.birthDate();
                                if (m.motherName() != null) member.motherName = m.motherName();
                                if (m.responsible() != null) member.responsible = m.responsible();
                            });
                }
            });
        }

        family.persist();
        return FamilyResponseDTO.fromEntity(family);
    }

    @Transactional
    public void deleteFamily(Long id, JsonWebToken jwt) {

        var groups = jwt.getGroups();

        if (groups.contains(Roles.ADMIN.name())) {

            FamilyEntity family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family with id " + id + " not found."));
            family.delete();

        } else {

            FamilyEntity family = FamilyEntity.<FamilyEntity>findByIdOptional(id)
                    .filter(f -> f.parish.id.equals(Long.valueOf(jwt.getClaim("parish").toString())) &&
                            f.parish.isDiocese.equals(Boolean.FALSE))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Family not found.",
                            "Family with id " + id + " not found in your parish."));

            family.delete();
        }
    }
}
