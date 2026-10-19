/**
 * Marker contract for HTTP response envelopes in the infrastructure layer.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BaseResponse {}

/**
 * Base shape for infrastructure resources exchanged with remote APIs.
 */
export interface BaseResource {
  id: string;
}