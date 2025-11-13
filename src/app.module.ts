import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextService } from './request-context/request-context.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { getTypeOrmConfig } from 'config/db';
import { mongooseConfig } from 'config/db/mongoose';
import { BaseEntitySubscriber } from './subscribers/base-entity.subscriber';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => mongooseConfig,
    }),
    RedisModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_DB_HOST,
        port: Number(process.env.REDIS_DB_PORT),
        password: process.env.REDIS_DB_AUTH,
      },
    }),
    CacheModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService, BaseEntitySubscriber],
})
export class AppModule {}
