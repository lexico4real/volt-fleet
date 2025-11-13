import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return new Redis(redisUrl);
        }

        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService
          .get<string>('REDIS_AUTH', '')
          ?.replace(/\\/g, '');

        return new Redis({
          host,
          port,
          password,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
