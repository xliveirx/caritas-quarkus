package br.com.caritas.util;

import br.com.caritas.entity.donation.Unit;
import br.com.caritas.exception.BusinessRuleException;

import java.math.BigDecimal;
import java.util.Set;

public class UnitConverter {

    private static final Set<Unit> WEIGHT = Set.of(Unit.KG, Unit.G);
    private static final Set<Unit> VOLUME = Set.of(Unit.ML, Unit.L);

    public static BigDecimal convert(BigDecimal quantity, Unit from, Unit to) {
        if (from == to) return quantity;

        if (!areCompatible(from, to)) {
            throw new BusinessRuleException(
                    "Unidades incompatíveis.",
                    "Não é possível converter de " + from + " para " + to + "."
            );
        }

        if (from == Unit.G  && to == Unit.KG) return quantity.divide(BigDecimal.valueOf(1000));
        if (from == Unit.KG && to == Unit.G)  return quantity.multiply(BigDecimal.valueOf(1000));
        if (from == Unit.ML && to == Unit.L)  return quantity.divide(BigDecimal.valueOf(1000));
        if (from == Unit.L  && to == Unit.ML) return quantity.multiply(BigDecimal.valueOf(1000));

        return quantity;
    }

    private static boolean areCompatible(Unit a, Unit b) {
        return (WEIGHT.contains(a) && WEIGHT.contains(b))
                || (VOLUME.contains(a) && VOLUME.contains(b))
                || (a == Unit.UNIDADES && b == Unit.UNIDADES);
    }
}
