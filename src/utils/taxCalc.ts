// src/utils/taxCalc.ts

export const calculateEstimatedTax = (revenue: number) => {
  // Simple Lesotho Small Business Estimate (Simplified for MVP)
  // Let's assume a flat 10% for very small businesses or 
  // use the progressive brackets we discussed earlier.
  const taxRate = 0.15; // 15% VAT or basic Income Tax estimate
  return revenue * taxRate;
};