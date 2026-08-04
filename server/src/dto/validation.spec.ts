import { ValidationPipe, BadRequestException } from '@nestjs/common';

import { SignupDto, UpdateUserDto } from './auth.dto';
import { UpdateRideDto } from './update-ride.dto';

// Mirrors the configuration applied globally in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
});

function run<T>(value: unknown, metatype: new () => T): Promise<T> {
  return pipe.transform(value, { type: 'body', metatype }) as Promise<T>;
}

describe('UpdateUserDto whitelisting', () => {
  it('keeps the editable profile fields', async () => {
    const result = await run(
      {
        password: 'correct-horse',
        updates: { fullname: 'New Name', phone: '9800000000' },
      },
      UpdateUserDto,
    );

    expect(result.updates).toEqual({
      fullname: 'New Name',
      phone: '9800000000',
    });
  });

  it('strips self-granted karma, credit score and role', async () => {
    const result = await run(
      {
        password: 'correct-horse',
        updates: {
          fullname: 'New Name',
          karmaPoints: 999999,
          creditScore: 999999,
          role: 'rider',
          ratings: 5,
        },
      },
      UpdateUserDto,
    );

    expect(result.updates).toEqual({ fullname: 'New Name' });
    expect(result.updates).not.toHaveProperty('karmaPoints');
    expect(result.updates).not.toHaveProperty('creditScore');
    expect(result.updates).not.toHaveProperty('role');
    expect(result.updates).not.toHaveProperty('ratings');
  });

  it('strips email and password from the nested updates', async () => {
    const result = await run(
      {
        password: 'correct-horse',
        updates: { email: 'attacker@evil.com', password: 'new-password' },
      },
      UpdateUserDto,
    );

    expect(result.updates).toEqual({});
  });
});

describe('SignupDto', () => {
  it('does not accept a self-declared rating', async () => {
    const result = await run(
      {
        fullname: 'A',
        email: 'a@example.com',
        password: 'pw',
        role: 'rider',
        ratings: 5,
      },
      SignupDto,
    );

    expect(result).not.toHaveProperty('ratings');
  });

  it('rejects a role outside the allowed set', async () => {
    await expect(
      run(
        {
          fullname: 'A',
          email: 'a@example.com',
          password: 'pw',
          role: 'admin',
        },
        SignupDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UpdateRideDto whitelisting', () => {
  it('keeps the editable trip fields', async () => {
    const result = await run(
      { from: 'A', to: 'B', fromLat: 27.7, message: 'hi' },
      UpdateRideDto,
    );

    expect(result).toEqual({
      from: 'A',
      to: 'B',
      fromLat: 27.7,
      message: 'hi',
    });
  });

  it('strips status so a ride cannot be self-marked COMPLETED', async () => {
    const result = await run({ from: 'A', status: 'COMPLETED' }, UpdateRideDto);

    expect(result).not.toHaveProperty('status');
  });

  it('strips the relational columns that would reassign a ride', async () => {
    const result = await run(
      {
        from: 'A',
        riderId: 99,
        passengerId: 99,
        createdBy: 99,
        matchGroupId: 'forged',
      },
      UpdateRideDto,
    );

    expect(result).toEqual({ from: 'A' });
  });

  it('strips the derived statistics used for karma', async () => {
    const result = await run(
      { from: 'A', distance: 9999, co2Saved: 9999, peopleImpacted: 9999 },
      UpdateRideDto,
    );

    expect(result).toEqual({ from: 'A' });
  });

  it('still enforces the declared coordinate bounds', async () => {
    await expect(run({ fromLat: 999 }, UpdateRideDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
