import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Fleet } from '../entities/fleet.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { User } from 'src/auth/entities/user.entity';
import { CreateFleetDto } from '../dto/create-fleet.dto';
import { GetFleetsDto } from '../dto/get-fleets.dto';
import { generatePagination } from 'common/utils/pagination';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,

    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createFleet(createFleetDto: CreateFleetDto): Promise<Fleet> {
    const { name, managerId } = createFleetDto;
    const manager = await this.userRepository.findOneBy({ id: managerId });

    if (!manager) {
      throw new NotFoundException('Manager not found.');
    }

    const fleet = this.fleetRepository.create({
      name,
      manager,
    });

    return this.fleetRepository.save(fleet);
  }

  async getAllFleets(getFleetsDto: GetFleetsDto, req?: Request) {
    try {
      const { page = 1, perPage = 10 } = getFleetsDto;
      const skip = (page - 1) * perPage;

      const query = this.fleetRepository
        .createQueryBuilder('fleet')
        .leftJoinAndSelect('fleet.vehicles', 'vehicle')
        .orderBy('fleet.createdAt', 'DESC');

      query.skip(skip).take(perPage);

      const [data, total] = await query.getManyAndCount();

      return generatePagination(page, perPage, total, req, data);
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve fleets');
    }
  }

  /** Get a single fleet by ID */
  async getFleetById(fleetId: string): Promise<Fleet> {
    const fleet = await this.fleetRepository.findOne({
      where: { id: fleetId },
      relations: ['vehicles'],
    });
    if (!fleet)
      throw new NotFoundException(`Fleet with ID ${fleetId} not found`);
    return fleet;
  }

  async updateFleet(
    fleetId: string,
    updateData: Partial<Fleet>,
  ): Promise<Fleet> {
    const fleet = await this.getFleetById(fleetId);
    Object.assign(fleet, updateData);
    return this.fleetRepository.save(fleet);
  }

  async deleteFleet(fleetId: string): Promise<void> {
    const fleet = await this.getFleetById(fleetId);
    await this.fleetRepository.remove(fleet);
  }

  async assignVehicleToFleet(
    fleetId: string,
    vehicleId: string,
  ): Promise<Vehicle> {
    const fleet = await this.getFleetById(fleetId);
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle)
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    vehicle.fleet = fleet;
    return this.vehicleRepository.save(vehicle);
  }

  async getFleetSummary(fleetId: string) {
    const fleet = await this.getFleetById(fleetId);
    const totalVehicles = fleet.vehicles.length;
    const activeVehicles = fleet.vehicles.filter(
      (v) => v.status === 'ACTIVE',
    ).length;
    return {
      fleetId,
      totalVehicles,
      activeVehicles,
      inactiveVehicles: totalVehicles - activeVehicles,
    };
  }
}
