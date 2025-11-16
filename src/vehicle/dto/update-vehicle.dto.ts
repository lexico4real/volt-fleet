import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { VehicleStatus } from 'common/enums/vehicle-status';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsOptional()
  @IsString()
  vin: string;

  @IsOptional()
  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsNumber()
  year: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsOptional()
  @IsUUID()
  fleetId: string;
}
