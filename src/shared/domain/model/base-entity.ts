/**
 * Base entity interface that all entities should implement. It includes a
 * unique identifier whose type can be specialized by each bounded context.
 */
export interface BaseEntity<TId = string> {
  id: TId;
}
