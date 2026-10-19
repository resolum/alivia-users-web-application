/**
 * Represents a currency
 */
export class Currency {

  /**
   * The ISO 4217 code of the currency (e.g., "USD", "EUR").
   * @private Code is stored as a string to allow for flexibility in currency codes.
   */
  private _code: string;

  /**
   * The symbol of the currency (e.g., "$", "€").
   * @private Symbol is stored as a string to allow for flexibility in currency symbols.
   */
  private _symbol: string;

  /**
   * Create a Currency
   * @param currency - An object containing the code and symbol of the currency.
   */
  constructor(currency: { code: string, symbol: string }) {
    this._code = currency.code;
    this._symbol = currency.symbol;
  }

  /**
   * Getter for the currency code.
   * @returns The ISO 4217 code of the currency.
   */
  get code(): string {
    return this._code;
  }

  get symbol(): string {
    return this._symbol;
  }
}