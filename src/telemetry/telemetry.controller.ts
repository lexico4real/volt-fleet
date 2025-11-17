import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  ValidationPipe,
  UsePipes,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { GetHistoryDto } from './dto/get-history.dto';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async ingest(@Body() createTelemetryDto: CreateTelemetryDto) {
    return this.telemetryService.ingestTelemetry(createTelemetryDto);
  }

  @Get(':vehicleId/latest')
  async latest(@Param('vehicleId') vehicleId: string) {
    return this.telemetryService.getLatest(vehicleId);
  }

  @Get(':vehicleId/history')
  async history(
    @Param('vehicleId') vehicleId: string,
    @Query() getHistoryDto: GetHistoryDto,
    @Req() req: Request,
  ) {
    return this.telemetryService.getHistory(vehicleId, getHistoryDto, req);
  }
}
