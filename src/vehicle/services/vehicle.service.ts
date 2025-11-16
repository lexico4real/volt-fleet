import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';
import { generatePagination } from 'common/utils/pagination';
import { GetVehiclesDto } from '../dto/get-vehicles.dto';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async createVehicle(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async getAllVehicles(getVehiclesDto: GetVehiclesDto, req?: Request) {
    try {
      const { status, fleetId, page = 1, perPage = 10 } = getVehiclesDto;
      const skip = (page - 1) * perPage;

      const query = this.vehicleRepository
        .createQueryBuilder('vehicle')
        .leftJoinAndSelect('vehicle.fleet', 'fleet')
        .orderBy('vehicle.createdAt', 'DESC');

      if (status) query.andWhere('vehicle.status = :status', { status });
      if (fleetId) query.andWhere('vehicle.fleetId = :fleetId', { fleetId });

      query.skip(skip).take(perPage);

      const [data, total] = await query.getManyAndCount();

      return generatePagination(page, perPage, total, req, data);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve vehicles');
    }
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(id: string): Promise<void> {
    const vehicle = await this.getVehicleById(id);
    await this.vehicleRepository.remove(vehicle);
  }
}
