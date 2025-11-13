import { AccountStatus } from 'common/enums/account-status';
import { BaseEntity } from 'src/base.entity';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Index('user_account_status_idx')
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.INACTIVE,
  })
  accountStatus: AccountStatus;

  @Column({ default: false })
  isEmailVerified: boolean;

  @ManyToOne(() => UserRole, { eager: true, nullable: true })
  @JoinColumn({ name: 'userRoleId' })
  userRole: UserRole;
}
