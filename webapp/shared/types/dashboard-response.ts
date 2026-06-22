import type { BazarSaleResponse } from './bazar-sale-response';
import type { CashRegisterResponse } from './cash-register-response';
import type { VisitResponse } from './visit-response';

export interface DashboardResponse {
  totalFamilies: number;
  recentSales: BazarSaleResponse[];
  totalMonthSales: number;
  cashRegister: CashRegisterResponse;
  totalDonationEntries: number;
  totalMonthDonationEntries: number;
  totalDonationExits: number;
  totalMonthDonationExits: number;
  totalParishCoordinators: number;
  totalParishVolunteers: number;
  lastVisits: VisitResponse[];
}
