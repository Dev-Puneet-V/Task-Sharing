interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, delay: number) => void;
}

interface RetryState {
  attempt: number;
  nextDelay: number;
}

export class RetryManager {
  private config: RetryConfig;
  private state: RetryState;
  private timeoutId: number | null;
  private aborted: boolean;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 5,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoffFactor: config.backoffFactor ?? 2,
      shouldRetry: config.shouldRetry ?? (() => true),
      onRetry: config.onRetry,
    };

    this.state = {
      attempt: 0,
      nextDelay: this.config.initialDelay,
    };

    this.timeoutId = null;
    this.aborted = false;
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    while (this.state.attempt < this.config.maxAttempts && !this.aborted) {
      try {
        return await operation();
      } catch (error) {
        const shouldRetry = this.config.shouldRetry?.(error) ?? true;
        if (!shouldRetry || this.state.attempt + 1 >= this.config.maxAttempts) {
          throw error;
        }

        await this.wait();
        this.state.attempt++;
        this.state.nextDelay = Math.min(
          this.state.nextDelay * this.config.backoffFactor,
          this.config.maxDelay
        );
      }
    }

    throw new Error("Max retry attempts reached");
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => {
      if (this.config.onRetry) {
        this.config.onRetry(this.state.attempt + 1, this.state.nextDelay);
      }

      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        resolve();
      }, this.state.nextDelay);
    });
  }

  public abort(): void {
    this.aborted = true;
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public reset(): void {
    this.state = {
      attempt: 0,
      nextDelay: this.config.initialDelay,
    };
    this.aborted = false;
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public get currentAttempt(): number {
    return this.state.attempt;
  }

  public get nextRetryDelay(): number {
    return this.state.nextDelay;
  }

  public get isMaxAttemptsReached(): boolean {
    return this.state.attempt >= this.config.maxAttempts;
  }
}

// Utility function to create a retry manager with default configuration
export const createRetryManager = (
  config?: Partial<RetryConfig>
): RetryManager => {
  return new RetryManager(config);
};

export default RetryManager;
