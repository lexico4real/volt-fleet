import { PartialType } from '@nestjs/swagger';
import { CreateFleetDto } from './create-fleet.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFleetDto extends PartialType(CreateFleetDto) {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  managerId: string;
}
