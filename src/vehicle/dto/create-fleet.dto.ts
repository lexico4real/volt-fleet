import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFleetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  managerId: string;
}
