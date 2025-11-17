import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryGateway } from './telemetry.gateway';
import { Telemetry } from './entities/telemetry.entity';
import { GetHistoryDto } from './dto/get-history.dto';
import { generatePagination } from 'common/utils/pagination';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly gateway: TelemetryGateway,
    @InjectRepository(Telemetry)
    private readonly telemetryRepository: Repository<Telemetry>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async ingestTelemetry(dto: CreateTelemetryDto) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    const payload = {
      vehicleId: dto.vehicleId,
      fleetId: dto.fleetId ?? 'unknown',
      location: { lat: dto.latitude, lon: dto.longitude },
      speed: dto.speed,
      soc: dto.soc,
      temperature: dto.temperature,
      receivedAt: new Date().toISOString(),
    };

    if (payload.fleetId) {
      try {
        this.gateway.broadcastToFleet(payload.fleetId, payload);
      } catch (err) {
        this.logger.warn('Failed to broadcast telemetry over websocket', err);
      }
    }

    try {
      const rec = this.telemetryRepository.create({
        vehicleId: dto.vehicleId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        speed: dto.speed,
        soc: dto.soc,
        temperature: dto.temperature,
        fleetId: dto.fleetId ?? 'unknown',
      });
      await this.telemetryRepository.save(rec);
    } catch (err) {
      this.logger.warn('Failed to write telemetry to Postgres (optional)', err);
    }

    return { success: true, payload };
  }

  async getLatest(vehicleId: string) {
    const rec = await this.telemetryRepository.findOne({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });
    return rec ?? null;
  }

  async getHistory(
    vehicleId: string,
    getHistoryDto: GetHistoryDto,
    req?: Request,
  ) {
    const { from, to, page = 1, perPage = 10 } = getHistoryDto;
    const skip = (page - 1) * perPage;

    const qb = this.telemetryRepository
      .createQueryBuilder('t')
      .where('t.vehicleId = :vehicleId', { vehicleId })
      .orderBy('t.createdAt', 'DESC');

    if (from) qb.andWhere('t.createdAt >= :from', { from });
    if (to) qb.andWhere('t.createdAt <= :to', { to });

    qb.skip(skip).take(perPage);

    const [data, total] = await qb.getManyAndCount();

    return generatePagination(page, perPage, total, req, data);
  }
}
