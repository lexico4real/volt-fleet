import {
  IsNumber,
  IsString,
  IsOptional,
  IsISO8601,
  IsNotEmpty,
} from 'class-validator';

export class CreateTelemetryDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  speed: number;

  @IsNumber()
  soc: number;

  @IsNumber()
  temperature: number;

  @IsOptional()
  @IsString()
  fleetId?: string;
}
