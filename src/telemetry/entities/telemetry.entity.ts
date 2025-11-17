import { BaseEntity } from 'src/base.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Entity, Column, Index, ManyToOne } from 'typeorm';

@Entity({ name: 'telemetry' })
export class Telemetry extends BaseEntity {
  @Index()
  @Column()
  vehicleId: string;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column('float')
  speed: number;

  @Column('float')
  soc: number;

  @Column('float')
  temperature: number;

  @Index()
  @Column({ nullable: true })
  fleetId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.telemetry)
  vehicle: Vehicle;
}
