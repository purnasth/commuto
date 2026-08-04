import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Ride } from 'generated/prisma';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { requireSecret } from '../env.service';
import { Server, Socket } from 'socket.io';

const userSocketMap = new Map<string, string>();

interface AccessTokenPayload {
  sub: number;
  email: string;
}

/**
 * The ride fields the notification payloads actually read.
 *
 * Declared as a Pick rather than the full `Ride` so callers can pass rows
 * fetched with a narrowed `select`; a complete row still satisfies it.
 */
type NotifiableRide = Pick<
  Ride,
  | 'id'
  | 'from'
  | 'to'
  | 'message'
  | 'role'
  | 'timestamp'
  | 'status'
  | 'riderId'
  | 'passengerId'
>;

type CompletableRide = NotifiableRide &
  Pick<Ride, 'distance' | 'co2Saved' | 'peopleImpacted'>;

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class RideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(RideGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === client.id) {
        userSocketMap.delete(userId);
        this.logger.log(`User ${userId} deregistered on disconnect.`);
        break;
      }
    }
  }

  /**
   * Resolves the user id a socket may register as, from its access token.
   *
   * The token is the only accepted source of identity here. Trusting a
   * client-supplied id would let anyone claim another user's socket and
   * receive their ride confirmations, which carry pickup and drop-off
   * locations and schedules.
   */
  private resolveUserId(client: Socket): number | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    const header = client.handshake.headers.authorization;
    const token =
      auth?.token ?? (header?.startsWith('Bearer ') ? header.slice(7) : header);

    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: requireSecret(this.configService, 'JWT_SECRET'),
      });

      return payload.sub;
    } catch {
      return null;
    }
  }

  @SubscribeMessage('registerUser')
  handleRegisterUser(@ConnectedSocket() client: Socket): void {
    const userId = this.resolveUserId(client);

    if (userId === null) {
      this.logger.warn(
        `Socket ${client.id} attempted to register without a valid access token.`,
      );
      client.emit('error', 'Authentication required to register.');
      return;
    }

    userSocketMap.set(userId.toString(), client.id);
    this.logger.log(`User ${userId} registered with socket ${client.id}`);

    client.emit(
      'registrationSuccess',
      `User ${userId} successfully registered.`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    client.emit('pong', `Pong! You sent: ${data}`);
    return `Server received: ${data}`;
  }

  // The 'sendToAll' and 'sendToRegisteredUser' debug handlers were removed:
  // any anonymous socket could broadcast to every connected user, or address a
  // user by id and learn from the error reply whether they were online.
  // Nothing in the app emitted them.

  notifyRideConfirmation(confirmedRide: NotifiableRide) {
    const payload = {
      id: confirmedRide.id,
      from: confirmedRide.from,
      to: confirmedRide.to,
      message: confirmedRide.message,
      role: confirmedRide.role,
      timestamp: confirmedRide.timestamp?.toISOString(),
      status: confirmedRide.status,
      riderId: confirmedRide.riderId,
      passengerId: confirmedRide.passengerId,
    };

    // Notify the rider if present
    if (confirmedRide.riderId !== null) {
      const riderSocketId = userSocketMap.get(confirmedRide.riderId.toString());

      if (riderSocketId) {
        this.server.to(riderSocketId).emit('rideConfirmed', payload);
        this.logger.log(
          `'rideConfirmed' emitted to rider ${confirmedRide.riderId}`,
        );
      } else {
        this.logger.warn(
          `Rider ${confirmedRide.riderId} not connected via WebSocket.`,
        );
      }
    }

    // Notify the passenger if present
    if (confirmedRide.passengerId !== null) {
      const passengerSocketId = userSocketMap.get(
        confirmedRide.passengerId.toString(),
      );
      if (passengerSocketId) {
        this.server.to(passengerSocketId).emit('rideConfirmed', payload);
        this.logger.log(
          `'rideConfirmed' emitted to passenger ${confirmedRide.passengerId}`,
        );
      } else {
        this.logger.warn(
          `Passenger ${confirmedRide.passengerId} not connected via WebSocket.`,
        );
      }
    }

    if (!confirmedRide.riderId && !confirmedRide.passengerId) {
      this.logger.warn(
        `Ride ${confirmedRide.id} confirmation cannot be emitted: Missing both riderId and passengerId.`,
      );
    }
  }

  notifyRideCompletion(ride: CompletableRide) {
    const payload = {
      id: ride.id,
      from: ride.from,
      to: ride.to,
      message: ride.message,
      role: ride.role,
      timestamp: ride.timestamp?.toISOString(),
      status: ride.status,
      riderId: ride.riderId,
      passengerId: ride.passengerId,
      distance: ride.distance,
      co2Saved: ride.co2Saved,
      peopleImpacted: ride.peopleImpacted,
    };

    if (ride.riderId !== null) {
      const riderSocketId = userSocketMap.get(ride.riderId.toString());

      if (riderSocketId) {
        this.server.to(riderSocketId).emit('rideCompleted', payload);
        this.logger.log(`'rideCompleted' emitted to rider ${ride.riderId}`);
      } else {
        this.logger.warn(`Rider ${ride.riderId} not connected via WebSocket.`);
      }
    } else {
      this.logger.warn(
        `Ride ${ride.id} completion cannot be emitted to rider: Missing riderId.`,
      );
    }

    // Also notify passenger if present
    if (ride.passengerId !== null) {
      const passengerSocketId = userSocketMap.get(ride.passengerId.toString());

      if (passengerSocketId) {
        this.server.to(passengerSocketId).emit('rideCompleted', payload);
        this.logger.log(
          `'rideCompleted' emitted to passenger ${ride.passengerId}`,
        );
      } else {
        this.logger.warn(
          `Passenger ${ride.passengerId} not connected via WebSocket.`,
        );
      }
    }
  }

  notifyRideConfirmationForPassenger(
    confirmedRide: NotifiableRide,
    passengerId: number,
  ) {
    if (!passengerId) {
      this.logger.warn(
        `Ride ${confirmedRide.id} confirmation cannot be emitted to passenger: Missing passengerId.`,
      );
      return;
    }

    const payload = {
      id: confirmedRide.id,
      from: confirmedRide.from,
      to: confirmedRide.to,
      message: confirmedRide.message,
      role: confirmedRide.role,
      timestamp: confirmedRide.timestamp?.toISOString(),
      status: confirmedRide.status,
      riderId: confirmedRide.riderId,
    };

    const passengerSocketId = userSocketMap.get(passengerId.toString());

    if (passengerSocketId) {
      this.server.to(passengerSocketId).emit('rideConfirmed', payload);
      this.logger.log(`'rideConfirmed' emitted to passenger ${passengerId}`);
    } else {
      this.logger.warn(`Passenger ${passengerId} not connected via WebSocket.`);
    }
  }

  @SubscribeMessage('joinRideRoom')
  async handleJoinRideRoom(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `ride_${data.rideId}`;

    await client.join(room);

    this.logger.log(`Client ${client.id} joined room: ${room}`);

    return { message: `Joined room: ${room}`, success: true };
  }
}
