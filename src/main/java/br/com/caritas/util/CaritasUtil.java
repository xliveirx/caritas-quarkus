package br.com.caritas.util;

import java.time.LocalDate;

public class CaritasUtil {

    public static boolean isCnpjValid(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) return false;

        cnpj = cnpj.replaceAll("[.\\-/]", "");

        if (cnpj.length() != 14) return false;
        if (cnpj.matches("(\\d)\\1{13}")) return false; // bloqueia sequências como 00000000000000

        int[] weights1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] weights2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

        int sum = 0;
        for (int i = 0; i < 12; i++) {
            sum += Character.getNumericValue(cnpj.charAt(i)) * weights1[i];
        }
        int digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        sum = 0;
        for (int i = 0; i < 13; i++) {
            sum += Character.getNumericValue(cnpj.charAt(i)) * weights2[i];
        }
        int digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        return Character.getNumericValue(cnpj.charAt(12)) == digit1
                && Character.getNumericValue(cnpj.charAt(13)) == digit2;
    }

    public static boolean isCpfValid(String cpf) {
        if (cpf == null || cpf.isBlank()) return false;

        cpf = cpf.replaceAll("[.\\-]", "");

        if (cpf.length() != 11) return false;
        if (cpf.matches("(\\d)\\1{10}")) return false; // bloqueia 00000000000, 11111111111...

        int[] weights1 = {10, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] weights2 = {11, 10, 9, 8, 7, 6, 5, 4, 3, 2};

        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += Character.getNumericValue(cpf.charAt(i)) * weights1[i];
        }
        int digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += Character.getNumericValue(cpf.charAt(i)) * weights2[i];
        }
        int digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

        return Character.getNumericValue(cpf.charAt(9)) == digit1
                && Character.getNumericValue(cpf.charAt(10)) == digit2;
    }

}
