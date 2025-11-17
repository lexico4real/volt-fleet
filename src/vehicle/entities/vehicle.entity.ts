import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/base.entity';
import { VehicleStatus } from 'common/enums/vehicle-status';
import { Fleet } from './fleet.entity';
import { Telemetry } from 'src/telemetry/entities/telemetry.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column({ unique: true })
  vin: string;

  @Column()
  model: string;

  @Column()
  manufacturer: string;

  @Column()
  year: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @ManyToOne(() => Fleet, (fleet) => fleet.vehicles)
  fleet: Fleet;

  @OneToMany(() => Telemetry, (telemetry) => telemetry.vehicle)
  telemetry: Telemetry[];
}
