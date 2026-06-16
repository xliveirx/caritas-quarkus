package br.com.caritas.util;

import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.Roles;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class JwtParishContext {

    @Inject
    JsonWebToken jwt;

    public boolean isAdmin() {
        return jwt.getGroups().contains(Roles.ADMIN.name());
    }

    public Long getParishClaim() {
        return Long.valueOf(jwt.getClaim("parish").toString());
    }

    /**
     * Para listagens: admin usa o parishId informado (null = todos), não-admin usa sempre o seu.
     */
    public Long resolveParishId(Long requestedParishId) {
        return isAdmin() ? requestedParishId : getParishClaim();
    }

    /**
     * Para operações onde o admin é obrigado a informar uma paróquia.
     * Não-admin usa sempre o seu parishId do JWT.
     */
    public Long requireParishId(Long requestedParishId) {
        if (isAdmin()) {
            if (requestedParishId == null) {
                throw new BusinessRuleException(
                        "Paróquia obrigatória.",
                        "Admin deve informar uma paróquia para esta operação.");
            }
            return requestedParishId;
        }
        return getParishClaim();
    }

    /**
     * Retorna true se o usuário é admin ou se a paróquia da entidade coincide com a sua.
     * Use em Optional.filter() para preservar semântica de 404 em vez de 403.
     */
    public boolean canAccess(Long entityParishId) {
        return isAdmin() || entityParishId.equals(getParishClaim());
    }

    /**
     * Lança BusinessRuleException se o usuário não for admin e a paróquia não for a sua.
     * Use quando o recurso já foi encontrado e o acesso deve ser verificado explicitamente.
     */
    public void requireSameParish(Long entityParishId) {
        if (!isAdmin() && !entityParishId.equals(getParishClaim())) {
            throw new BusinessRuleException(
                    "Acesso negado.",
                    "Você só pode acessar dados da sua própria paróquia.");
        }
    }

    /**
     * Resolve o parishId e carrega a ParishEntity correspondente.
     * Admin deve informar requestedParishId; não-admin usa o claim do JWT.
     */
    public ParishEntity resolveParish(Long requestedParishId) {
        Long id = requireParishId(requestedParishId);
        return ParishEntity.<ParishEntity>find("id = ?1", id)
                .firstResultOptional()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paróquia não encontrada.",
                        "Paróquia não encontrada com id " + id));
    }
}
