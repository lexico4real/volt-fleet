import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Telemetry, Vehicle])],
  providers: [TelemetryService, TelemetryGateway],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
