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
import { Server, Socket } from 'socket.io';

const userSocketMap = new Map<string, string>();

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

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
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

  @SubscribeMessage('sendToAll')
  handleSendToAll(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.server.emit('messageToAll', { sender: client.id, message: message });
  }

  @SubscribeMessage('sendToRegisteredUser')
  handleSendToRegisteredUser(
    @MessageBody() data: { targetUserId: string; message: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const targetSocketId = userSocketMap.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('privateMessage', {
        senderUserId: 'Server',
        message: data.message,
      });
      this.logger.log(`Sent private message to user ${data.targetUserId}`);
    } else {
      client.emit(
        'error',
        `User ${data.targetUserId} not found or not registered.`,
      );
      this.logger.warn(
        `User ${data.targetUserId} not found for private message.`,
      );
    }
  }

  notifyRideConfirmation(confirmedRide: Ride) {
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

  notifyRideCompletion(ride: Ride) {
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

  notifyRideConfirmationForPassenger(confirmedRide: Ride, passengerId: number) {
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
