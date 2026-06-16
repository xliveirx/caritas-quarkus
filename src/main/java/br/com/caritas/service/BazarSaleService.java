package br.com.caritas.service;

import br.com.caritas.dao.BazarSaleDAO;
import br.com.caritas.dto.ApiListDTO;
import br.com.caritas.dto.PaginationDTO;
import br.com.caritas.dto.bazar.BazarRequestDTO;
import br.com.caritas.dto.bazar.BazarSaleResponseDTO;
import br.com.caritas.entity.bazar.BazarSaleEntity;
import br.com.caritas.entity.bazar.BazarSaleItemEntity;
import br.com.caritas.entity.donation.StockItemEntity;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.exception.BusinessRuleException;
import br.com.caritas.exception.ResourceNotFoundException;
import br.com.caritas.util.JwtParishContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@ApplicationScoped
public class BazarSaleService {

    @Inject
    private BazarSaleDAO bazarSaleDAO;

    @Inject
    private CashRegisterService cashRegisterService;

    @Inject
    private JwtParishContext parishContext;

    public ApiListDTO getAllBazarSales(int page, int size, Long parishId,
                                       String search,
                                       LocalDate dateFrom, LocalDate dateTo,
                                       BigDecimal minTotal, BigDecimal maxTotal) {

        parishId = parishContext.resolveParishId(parishId);

        var query = bazarSaleDAO.findAll(page, size, parishId, search, dateFrom, dateTo, minTotal, maxTotal);

        var sales = query.list()
                .stream()
                .map(BazarSaleResponseDTO::fromEntity)
                .toList();

        return new ApiListDTO(
                sales,
                new PaginationDTO(page, size, query.pageCount(), query.count())
        );
    }

    public BazarSaleResponseDTO getBazarSaleById(Long id) {

        BazarSaleEntity sale = BazarSaleEntity.<BazarSaleEntity>findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Venda não encontrada",
                        "Venda não encontrada com id " + id
                ));

        this.parishContext.requireSameParish(sale.parish.id);

        return BazarSaleResponseDTO.fromEntity(sale);
    }

    @Transactional
    public BazarSaleResponseDTO createBazarSale(BazarRequestDTO req) {

        BazarSaleEntity sale = new BazarSaleEntity();

        sale.buyerName = req.buyerName();
        sale.buyerCpf = req.buyerCpf();
        sale.soldAt = LocalDateTime.now();
        sale.total = BigDecimal.ZERO;

        ParishEntity parish = parishContext.resolveParish(req.parishId());
        sale.parish = parish;
        sale.persist();

        req.items().forEach(itemReq -> {

            BazarSaleItemEntity item = new BazarSaleItemEntity();

            StockItemEntity stockItem = StockItemEntity.<StockItemEntity>find(
                            "id = ?1 and parish.id = ?2", itemReq.stockItemId(), sale.parish.id)
                    .firstResultOptional()
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Item não encontrado no estoque.",
                            "Item não encontrado com id " + itemReq.stockItemId()));

            if (stockItem.availableQuantity.subtract(new BigDecimal(itemReq.quantity())).compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException(
                        "Não foi possível registrar a venda.",
                        "O item " + stockItem.product.name + " não tem estoque suficiente."
                );
            }

            stockItem.availableQuantity = stockItem.availableQuantity.subtract(new BigDecimal(itemReq.quantity()));
            stockItem.persist();

            item.stockItem = stockItem;
            item.quantity = itemReq.quantity();
            item.unitPrice = itemReq.unitPrice();
            item.sale = sale;
            item.persist();

            sale.items.add(item);

        });

        sale.total = sale.items.stream().map(i ->
                i.unitPrice.multiply(new BigDecimal(i.quantity)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.cashRegisterService.registerFromBazar(sale);

        return BazarSaleResponseDTO.fromEntity(sale);
    }
}
