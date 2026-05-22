export type DonationStatus = 'CONFIRMED' | 'CANCELED';

export interface DonationEntrySummary {
  id: number;
  date: string;
  donator: string | null;
  observation: string | null;
  parish: { id: number; name: string };
  status: DonationStatus;
}
