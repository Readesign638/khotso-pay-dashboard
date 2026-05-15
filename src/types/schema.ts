export type PaymentMethod = 'M-Pesa' | 'EcoCash' | 'Cash' | 'Card';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  name: string;
  items?: string;      // ADD THIS - Products/items bought (optional for backward compatibility)
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  date: string; 
  time: string; 
}

export interface BusinessStats {
  totalRevenue: number;
  mpesaVolume: number;
  ecocashVolume: number;
  totalPending: number;
  revenueChange: string;
}