/**
 * @description
 * This file defines core application types, specifically the ActionState type
 * used for server action return values.
 */

/**
 * @interface ActionState<T>
 * @description
 * A generic type representing the state of an action.
 * It can either be a success state with a message and data, or a failure state
 * with a message and no data. This allows for consistent handling of
 * server action responses.
 *
 * @template T - The type of the data returned on success.
 *
 * @property {true} isSuccess - Indicates a successful action.
 * @property {string} message - A descriptive message about the action's outcome.
 * @property {T} data - The data returned by the action on success.
 *
 * @property {false} isSuccess - Indicates a failed action.
 * @property {string} message - A descriptive message about the action's failure.
 * @property {never} [data] - Ensures no data is present on failure, aiding type safety.
 */
export type ActionState<T> =
  | {
      isSuccess: true
      message: string
      data: T
    }
  | {
      isSuccess: false
      message: string
      data?: never // Ensures no data field on failure for stricter type checking
    }