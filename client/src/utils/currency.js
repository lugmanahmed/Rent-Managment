// Currency utility functions for the rental management system

export const CURRENCIES = {
  MVR: { 
    code: 'MVR', 
    symbol: 'MVR', 
    name: 'Maldivian Rufiyaa',
    rate: 1 // Base currency
  },
  USD: { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar',
    rate: 15.42 // Approximate rate to MVR
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro',
    rate: 16.85 // Approximate rate to MVR
  }
};

// Format currency amount with symbol
export const formatCurrency = (amount, currency = 'MVR') => {
  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) return `${amount}`;
  
  return `${currencyInfo.symbol} ${parseFloat(amount).toLocaleString()}`;
};

// Convert amount from one currency to another
export const convertCurrency = (amount, fromCurrency, toCurrency = 'MVR') => {
  const fromRate = CURRENCIES[fromCurrency]?.rate || 1;
  const toRate = CURRENCIES[toCurrency]?.rate || 1;
  
  // Convert to base currency (MVR) first, then to target currency
  const baseAmount = parseFloat(amount) * fromRate;
  return baseAmount / toRate;
};

// Get currency options for dropdowns
export const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.code} (${currency.name})`
  }));
};

// Get currency info by code
export const getCurrencyInfo = (currencyCode) => {
  return CURRENCIES[currencyCode] || CURRENCIES.MVR;
};

// Validate currency code
export const isValidCurrency = (currencyCode) => {
  return Object.keys(CURRENCIES).includes(currencyCode);
};
