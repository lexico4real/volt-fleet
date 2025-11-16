import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { FleetService } from '../services/fleet.service';
import { GetFleetsDto } from '../dto/get-fleets.dto';
import { CreateFleetDto } from '../dto/create-fleet.dto';
import { UpdateFleetDto } from '../dto/update-fleet.dto';

@Controller('fleets')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  createFleet(@Body() createFleetDto: CreateFleetDto) {
    return this.fleetService.createFleet(createFleetDto);
  }

  @Get()
  getAllFleets(@Query() getFleetsDto: GetFleetsDto, req?: Request) {
    return this.fleetService.getAllFleets(getFleetsDto, req);
  }

  @Get(':id')
  getFleetById(@Param('id') id: string) {
    return this.fleetService.getFleetById(id);
  }

  @Patch(':id')
  updateFleet(@Param('id') id: string, @Body() updateFleetDto: UpdateFleetDto) {
    return this.fleetService.updateFleet(id, updateFleetDto);
  }

  @Delete(':id')
  deleteFleet(@Param('id') id: string) {
    return this.fleetService.deleteFleet(id);
  }
}
