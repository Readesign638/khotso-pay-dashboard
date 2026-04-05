// src/services/transactionService.ts
import type { Transaction, BusinessStats } from '../types/schema';

export const TransactionService = {
  /**
   * Calculates dashboard metrics by separating realized revenue 
   * from outstanding credit (pending) sales.
   */
  calculateDashboardStats: (transactions: Transaction[]): BusinessStats => {
    // Filter by status for accurate accounting
    const completed = transactions.filter(t => t.status === 'Completed');
    const pending = transactions.filter(t => t.status === 'Pending');

    return {
      // Realized revenue is the sum of completed sales
      totalRevenue: completed.reduce((sum, t) => sum + t.amount, 0),
      
      // Breakdown by local provider (M-Pesa and EcoCash)
      mpesaVolume: completed
        .filter(t => t.method === 'M-Pesa')
        .reduce((sum, t) => sum + t.amount, 0),
        
      ecocashVolume: completed
        .filter(t => t.method === 'EcoCash')
        .reduce((sum, t) => sum + t.amount, 0),
        
      // Track "Money on the street" (Credit/Sekoloto)
      totalPending: pending.reduce((sum, t) => sum + t.amount, 0),
      
      revenueChange: "+12%" // This could be calculated by comparing to last month
    };
  },

  /**
   * Mock server synchronization to demonstrate async handling in portfolio.
   */
  async syncWithServer(transaction: Transaction): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('Syncing Khotso-Pay transaction...', transaction.id);
      setTimeout(() => resolve(true), 1000);
    });
  }
};