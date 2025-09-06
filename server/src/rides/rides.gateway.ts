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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === client.id) {
        userSocketMap.delete(userId);
        console.log(`User ${userId} deregistered on disconnect.`);
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
    console.log(`User ${userId} registered with socket ${client.id}`);

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
    console.log(`Received ping from ${client.id}: ${data}`);
    client.emit('pong', `Pong! You sent: ${data}`);
    return `Server received: ${data}`;
  }

  @SubscribeMessage('sendToAll')
  handleSendToAll(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(`Received 'sendToAll' from ${client.id}: ${message}`);
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
      console.log(`Sent private message to user ${data.targetUserId}`);
    } else {
      client.emit(
        'error',
        `User ${data.targetUserId} not found or not registered.`,
      );
      console.log(`User ${data.targetUserId} not found for private message.`);
    }
  }

  notifyRideConfirmation(confirmedRide: Ride) {
    const riderId = confirmedRide.riderId;

    if (!riderId) {
      console.warn(
        `Ride ${confirmedRide.id} confirmation cannot be emitted to rider: ` +
          `Missing riderId.`,
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

    const riderSocketId = userSocketMap.get(riderId.toString());

    console.log('riderSocketId:', riderSocketId);

    if (riderSocketId) {
      console.log('event emit');
      this.server.to(riderSocketId).emit('rideConfirmed', payload);
      console.log(`'rideConfirmed' emitted to rider ${riderId}`);
    } else {
      console.log(`Rider ${riderId} not connected via WebSocket.`);
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
      distance: ride.distance,
      co2Saved: ride.co2Saved,
      peopleImpacted: ride.peopleImpacted,
    };

    const riderSocketId = ride.riderId
      ? userSocketMap.get(ride.riderId.toString())
      : undefined;

    if (riderSocketId) {
      this.server.to(riderSocketId).emit('rideCompleted', payload);
      console.log(`'rideCompleted' emitted to rider ${ride.riderId}`);
    }
  }

  notifyRideConfirmationForPassenger(confirmedRide: Ride, passengerId: number) {
    if (!passengerId) {
      console.warn(
        `Ride ${confirmedRide.id} confirmation cannot be emitted to passenger: ` +
          `Missing passengerId.`,
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
      console.log(`'rideConfirmed' emitted to passenger ${passengerId}`);
    } else {
      console.log(`Passenger ${passengerId} not connected via WebSocket.`);
    }
  }

  @SubscribeMessage('joinRideRoom')
  handleJoinRideRoom(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `ride_${data.rideId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);

    return { message: `Joined room: ${room}`, success: true };
  }
}
