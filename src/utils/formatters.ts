/**
 * Formats a number as Lesotho Maloti (LSL)
 * Shows 'M' instead of 'LSL' for that authentic local look.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: 'LSL',
  }).format(amount).replace('LSL', 'M'); 
};

/**
 * Shortens long M-Pesa/EcoCash reference codes for mobile responsiveness
 */
export const truncateRef = (ref: string): string => {
  return ref.length > 8 ? `${ref.substring(0, 8)}...` : ref;
};

/**
 * Returns high-quality CDN URLs for payment provider logos.
 * Using direct links for M-Pesa and EcoCash logos.
 */
export const getProviderLogo = (method: string): string => {
  const logos: Record<string, string> = {
    // Official M-Pesa Logo
    'M-Pesa': 'https://bootflare.com/wp-content/uploads/2025/08/M-PESA-Logo-300x255.png',
    
    // Official EcoCash Logo
    'EcoCash': 'https://tse3.mm.bing.net/th/id/OIP.0583w0wij-V6Gli8Fm6--wHaBW?pid=Api&P=0&h=220',
    
    // Professional Cash Icon
    'Cash': 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
  };

  // FALLBACK: If method is missing, return a generic "Wallet" icon to keep the UI clean
  const fallback = 'https://cdn-icons-png.flaticon.com/512/631/631200.png';

  return logos[method] || fallback;
};