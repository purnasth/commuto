import {
  addMonthsToDate,
  generateVoucherId,
  generateRewardAbbreviation,
} from '../../src/utils/voucher.utils';

describe('voucher.utils', () => {
  it('should add months to date', () => {
    const date = new Date('2025-01-01');
    const result = addMonthsToDate(date, 2);
    expect(result.getMonth()).toBe(2); // March (0-based)
  });
  it('should generate voucher id', () => {
    const id = generateVoucherId('Coffee Coupon', 123);
    expect(id).toMatch(/KARMA-\d{4}-U123-cc/);
  });
  it('should generate reward abbreviation', () => {
    expect(generateRewardAbbreviation('Coffee Shop Coupon')).toBe('CSC');
  });
});
