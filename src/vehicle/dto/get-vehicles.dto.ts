import { IsEnum, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from 'common/enums/vehicle-status';

export class GetVehiclesDto {
  @IsOptional()
  @IsEnum(VehicleStatus, {
    message: 'status must be ACTIVE, INACTIVE, or MAINTENANCE',
  })
  status?: VehicleStatus;

  @IsOptional()
  @IsString({ message: 'fleetId must be a string' })
  fleetId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'perPage must be an integer' })
  @Min(1, { message: 'perPage must be at least 1' })
  perPage = 10;
}
