import { getLocalizedPrice } from '../localizedPricing';

describe('getLocalizedPrice', () => {
  it('formats the flat USD placeholder price', () => {
    expect(getLocalizedPrice(9.99)).toEqual({
      amount: 9.99,
      currencyCode: 'USD',
      formatted: '$9.99',
      isEstimate: true,
    });
  });

  it('flags every price as an estimate until a real store price replaces it', () => {
    expect(getLocalizedPrice(1.99).isEstimate).toBe(true);
    expect(getLocalizedPrice(129.99).isEstimate).toBe(true);
  });
});
