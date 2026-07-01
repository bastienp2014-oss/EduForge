import { useAppConfig } from '../store/useAppConfig';

export function useCurrency() {
  const { currency } = useAppConfig();

  const format = (amount: number) => {
    // Determine if it's a number to format with decimals
    // Let's format money like 5,00 and items like 5
    let numStr = amount.toString();
    
    // If symbol is $ or similar, we might want 2 decimals
    if (currency.symbol === '$' || currency.symbol === '€') {
      numStr = amount.toFixed(2).replace('.', ',');
    } else {
      // For stars, points, etc., just show integer or 1 decimal if needed
      numStr = Number.isInteger(amount) ? amount.toString() : amount.toFixed(1).replace('.', ',');
    }

    if (currency.position === 'prefix') {
      return `${currency.symbol} ${numStr}`;
    } else {
      return `${numStr} ${currency.symbol}`;
    }
  };

  return {
    format,
    name: currency.name,
    symbol: currency.symbol,
  };
}
