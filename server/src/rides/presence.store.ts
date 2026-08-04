import { Injectable } from '@nestjs/common';

/**
 * Which socket a user is currently reachable on.
 *
 * The gateway used to keep this in a module-level `Map`, which quietly ties
 * the whole notification path to a single process: run two API instances
 * behind a load balancer and a ride confirmed on instance A is never delivered
 * to a user whose socket lives on instance B. Nothing errors -- the
 * notification is simply dropped -- which is the worst way for it to fail.
 *
 * Putting it behind this interface means swapping in a shared backing store is
 * a one-class change rather than surgery on the gateway.
 */
export abstract class PresenceStore {
  abstract set(userId: string, socketId: string): Promise<void> | void;
  abstract get(
    userId: string,
  ): Promise<string | undefined> | string | undefined;
  abstract removeSocket(socketId: string): Promise<void> | void;
  abstract size(): Promise<number> | number;
}

/**
 * Single-process implementation, equivalent to the previous behaviour.
 *
 * Correct for one instance. A Redis-backed implementation is what makes the
 * API horizontally scalable; it is deliberately not written blind here, since
 * there is no Redis in this environment to verify it against.
 */
@Injectable()
export class InMemoryPresenceStore extends PresenceStore {
  private readonly userToSocket = new Map<string, string>();

  set(userId: string, socketId: string): void {
    this.userToSocket.set(userId, socketId);
  }

  get(userId: string): string | undefined {
    return this.userToSocket.get(userId);
  }

  /** Called on disconnect, where only the socket id is known. */
  removeSocket(socketId: string): void {
    for (const [userId, id] of this.userToSocket.entries()) {
      if (id === socketId) {
        this.userToSocket.delete(userId);
        return;
      }
    }
  }

  size(): number {
    return this.userToSocket.size;
  }
}
