// src/modules/telemetry/telemetry.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/telemetry',
  transports: ['websocket'],
  cors: { origin: '*' },
})
@Injectable()
export class TelemetryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);

  private subscriptions: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() payload: { fleetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { fleetId } = payload;
    if (!fleetId) return;
    const set = this.subscriptions.get(client.id) ?? new Set<string>();
    set.add(fleetId);
    this.subscriptions.set(client.id, set);
    client.join(`fleet:${fleetId}`);
    this.logger.log(`Client ${client.id} subscribed to fleet:${fleetId}`);
    return { success: true, fleetId };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() payload: { fleetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { fleetId } = payload;
    const set = this.subscriptions.get(client.id);
    if (set) {
      set.delete(fleetId);
      client.leave(`fleet:${fleetId}`);
    }
    return { success: true, fleetId };
  }

  broadcastToFleet(fleetId: string, telemetry: any) {
    this.server.to(`fleet:${fleetId}`).emit('telemetry', telemetry);
  }
}
