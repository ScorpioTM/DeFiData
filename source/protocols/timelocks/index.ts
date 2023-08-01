/**
 * Represents an unlock event on a timelock object.
 *
 * @category PinkLock
 * @category UniCrypt
 */
export interface Unlock {
  /**
   * The amount of tokens unlocked during this event.
   */
  unlockAmount: bigint;
  /**
   * The date when the tokens are unlocked.
   */
  unlockDate: Date;
}

/**
 * Represents a vault on a timelock object.
 *
 * @category PinkLock
 * @category UniCrypt
 */
export interface Vault {
  /**
   * The name of the vault.
   */
  name?: string;
  /**
   * The address of the vault.
   */
  address: string;
}

/**
 * Represents a timelock with its associated information.
 *
 * @category PinkLock
 * @category UniCrypt
 */
export interface Timelock {
  /**
   * The vault where the tokens are locked.
   */
  vault: Vault;
  /**
   * The token address being locked.
   */
  token: string;
  /**
   * The owner of the timelock.
   */
  owner: string;
  /**
   * The total amount of tokens locked in the timelock.
   */
  locked: bigint;
  /**
   * The total amount of tokens already unlocked.
   */
  unlocked: bigint;
  /**
   * An array of unlock events (Unlocks) associated with the timelock.
   */
  unlocks: Unlock[];
  /**
   * (Optional) A description of the timelock.
   */
  description?: string;
  /**
   * (Optional) Indicates if the token is an LP (liquidity provider) token.
   */
  isLpToken?: boolean;
  /**
   * The date when the timelock was created.
   */
  date: Date;
}

export * from './pinklock';
export * from './unicrypt';
