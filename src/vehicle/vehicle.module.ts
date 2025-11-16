import { Module } from '@nestjs/common';
import { VehicleService } from './services/vehicle.service';
import { VehicleController } from './controllers/vehicle.controller';
import { FleetService } from './services/fleet.service';
import { FleetController } from './controllers/fleet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { PassportModule } from '@nestjs/passport';
import { Fleet } from './entities/fleet.entity';
import { User } from 'src/auth/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Vehicle, Fleet, User]),
  ],
  controllers: [VehicleController, FleetController],
  providers: [VehicleService, FleetService],
  exports: [VehicleService, FleetService, TypeOrmModule],
})
export class VehicleModule {}
