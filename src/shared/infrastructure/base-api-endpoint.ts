import type { BaseEntity } from '../domain/model/base-entity.ts';
import type { BaseResource, BaseResponse } from './base-response.ts';
import type { BaseAssembler } from './base-assembler.ts';

/**
 * Reusable infrastructure endpoint for CRUD interactions with remote APIs.
 *
 * @remarks
 * This class is part of the infrastructure layer and translates transport
 * contracts into domain entities through an assembler.
 *
 * @typeParam TEntity - Domain entity returned to upper layers.
 * @typeParam TResource - Infrastructure resource contract for single records.
 * @typeParam TResponse - Infrastructure response envelope contract.
 * @typeParam TAssembler - Mapper between domain entities and infrastructure contracts.
 */
export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse>,
> {
  protected readonly endpointUrl: string;
  protected readonly assembler: TAssembler;
  protected constructor(endpointUrl: string, assembler: TAssembler) {
    this.endpointUrl = endpointUrl;
    this.assembler = assembler;
  }

  /**
   * Loads all records from the endpoint and maps them to domain entities.
   */
  async getAll(): Promise<TEntity[]> {
    try {
      const response = await fetch(this.endpointUrl);
      if (!response.ok) throw await this.buildError('Failed to fetch entities', response);

      const data: TResponse | TResource[] = await response.json();
      if (Array.isArray(data)) {
        return data.map((resource) => this.assembler.toEntityFromResource(resource));
      }
      return this.assembler.toEntitiesFromResponse(data as TResponse);
    } catch (error) {
      throw this.wrapError('Failed to fetch entities', error);
    }
  }

  /**
   * Loads one record by identifier and maps it to a domain entity.
   */
  async getById(id: string): Promise<TEntity> {
    try {
      const response = await fetch(`${this.endpointUrl}/${encodeURIComponent(id)}`);
      if (!response.ok) throw await this.buildError('Failed to fetch entity', response);
      const resource: TResource = await response.json();
      return this.assembler.toEntityFromResource(resource);
    } catch (error) {
      throw this.wrapError('Failed to fetch entity', error);
    }
  }
  /**
   * Persists a new domain entity through the infrastructure endpoint.
   */
  async create(entity: TEntity): Promise<TEntity> {
    try {
      const resource = this.assembler.toResourceFromEntity(entity);
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      if (!response.ok) throw await this.buildError('Failed to create entity', response);
      const created: TResource = await response.json();
      return this.assembler.toEntityFromResource(created);
    } catch (error) {
      throw this.wrapError('Failed to create entity', error);
    }
  }
  /**
   * Persists changes of a domain entity identified by `id`.
   */
  async update(entity: TEntity, id: string): Promise<TEntity> {
    try {
      const resource = this.assembler.toResourceFromEntity(entity);
      const response = await fetch(`${this.endpointUrl}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
      if (!response.ok) throw await this.buildError('Failed to update entity', response);
      const updated: TResource = await response.json();
      return this.assembler.toEntityFromResource(updated);
    } catch (error) {
      throw this.wrapError('Failed to update entity', error);
    }
  }
  /**
   * Deletes one record by identifier.
   */
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.endpointUrl}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw await this.buildError('Failed to delete entity', response);
    } catch (error) {
      throw this.wrapError('Failed to delete entity', error);
    }
  }
  /**
   * Builds an operation-scoped error from an HTTP response.
   */
  private async buildError(operation: string, response: Response): Promise<Error> {
    if (response.status === 404) {
      return new Error(`${operation}: Resource not found`);
    }
    let detail: string;
    try {
      const body = await response.text();
      detail = body || String(response.status);
    } catch {
      detail = String(response.status);
    }
    return new Error(`${operation}: ${detail}`);
  }
  /**
   * Wraps any thrown value into a proper Error, preserving already-built errors.
   */
  private wrapError(operation: string, error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(`${operation}: Unexpected error`);
  }
}