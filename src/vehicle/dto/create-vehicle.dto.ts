import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { VehicleStatus } from 'common/enums/vehicle-status';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  vin: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  manufacturer: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsUUID()
  fleetId: string;
}
