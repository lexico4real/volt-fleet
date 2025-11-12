import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextService } from './request-context/request-context.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RequestContextService],
})
export class AppModule {}
