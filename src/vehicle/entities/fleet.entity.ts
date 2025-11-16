import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/base.entity';
import { Vehicle } from './vehicle.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity('fleets')
export class Fleet extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @ManyToOne(() => User)
  manager: User;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.fleet)
  vehicles: Vehicle[];
}
