import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import type { Socket } from 'socket.io';

import { RideGateway } from './rides.gateway';
import { PresenceStore, InMemoryPresenceStore } from './presence.store';

const JWT_SECRET = 'test-secret';
const OTHER_SECRET = 'not-the-real-secret';

const VICTIM_ID = 42;
const ATTACKER_ID = 7;

/** Minimal socket stand-in capturing what the gateway emits back. */
function makeClient(token?: string) {
  const emitted: { event: string; payload: unknown }[] = [];

  return {
    id: 'socket-1',
    handshake: { auth: token ? { token } : {}, headers: {} },
    emit: (event: string, payload: unknown) => {
      emitted.push({ event, payload });
      return true;
    },
    emitted,
  } as unknown as Socket & { emitted: { event: string; payload: unknown }[] };
}

describe('RideGateway registration', () => {
  let gateway: RideGateway;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET })],
        }),
        JwtModule.register({ secret: JWT_SECRET }),
      ],
      providers: [
        RideGateway,
        { provide: PresenceStore, useClass: InMemoryPresenceStore },
      ],
    }).compile();

    gateway = moduleRef.get(RideGateway);
    jwt = moduleRef.get(JwtService);
  });

  // Also proves the gateway's JwtService/ConfigService dependencies resolve.
  it('registers a socket presenting a valid access token', () => {
    const token = jwt.sign({ sub: VICTIM_ID, email: 'a@b.c' });
    const client = makeClient(token);

    gateway.handleRegisterUser(client);

    expect(client.emitted).toEqual([
      {
        event: 'registrationSuccess',
        payload: `User ${VICTIM_ID} successfully registered.`,
      },
    ]);
  });

  it('refuses to register a socket with no token', () => {
    const client = makeClient();

    gateway.handleRegisterUser(client);

    expect(client.emitted[0].event).toBe('error');
  });

  it('refuses a token signed with the wrong secret', () => {
    const forged = new JwtService({ secret: OTHER_SECRET }).sign({
      sub: VICTIM_ID,
      email: 'a@b.c',
    });
    const client = makeClient(forged);

    gateway.handleRegisterUser(client);

    expect(client.emitted[0].event).toBe('error');
  });

  it('binds the socket to the token subject, not any client-supplied id', () => {
    // The attacker holds a valid token for their own account and tries to
    // register as the victim; identity must come from the token alone.
    const token = jwt.sign({ sub: ATTACKER_ID, email: 'attacker@b.c' });
    const client = makeClient(token);

    (gateway.handleRegisterUser as (c: Socket, id?: unknown) => void)(
      client,
      String(VICTIM_ID),
    );

    expect(client.emitted[0].payload).toBe(
      `User ${ATTACKER_ID} successfully registered.`,
    );
    expect(client.emitted[0].payload).not.toContain(String(VICTIM_ID));
  });
});
