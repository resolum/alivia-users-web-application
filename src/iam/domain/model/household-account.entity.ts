/**
 * Shared household account, with its verified responsible client.
 */
export class HouseholdAccount {
  private readonly _id: string;
  private readonly _alias: string;
  private readonly _responsibleAccountId: string;

  /**
   * Initializes a new HouseholdAccount instance.
   * @param params - Household identifier, alias and responsible account.
   */
  constructor(params: { id: string; alias: string; responsibleAccountId: string }) {
    this._id = params.id;
    this._alias = params.alias;
    this._responsibleAccountId = params.responsibleAccountId;
  }

  get id(): string {
    return this._id;
  }

  get alias(): string {
    return this._alias;
  }

  get responsibleAccountId(): string {
    return this._responsibleAccountId;
  }
}
