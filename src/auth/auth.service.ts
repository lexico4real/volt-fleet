import { AssignPrivilegeDto } from './dto/assign-privilege.dto';
import { AccessDto } from './dto/access.dto';
import {
  Injectable,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { FindManyOptions, ILike } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRoleRepository } from './repositories/user-role.repository';
import { UserPrivilegeRepository } from './repositories/user-privilege.repository';
import { UserRepository } from './repositories/user.repository';
import { AuthCredentialsDto } from './dto/auth-credential.dto';
import { generatePagination } from 'common/utils/pagination';
import { JwtPayload } from './jwt-payload-interface';
import { isUUID } from 'class-validator';
import { CacheService } from 'src/cache/cache.service';
import { NewPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { RolesConstant } from 'common/enums/roles';
import Logger from 'config/logger';

@Injectable()
export class AuthService {
  private readonly logger = new Logger();
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
    @InjectRepository(UserRoleRepository)
    private userRoleRepository: UserRoleRepository,
    @InjectRepository(UserPrivilegeRepository)
    private userPrivilegeRepository: UserPrivilegeRepository,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  async signUp(createUserDto: CreateUserDto, req: Request): Promise<void> {
    try {
      const { role, email } = createUserDto;

      const userInDB = await this.usersRepository.findOne({
        where: { email },
      });
      if (userInDB) {
        throw new ConflictException('Account with this email already exists');
      }

      const roleData = await this.userRoleRepository.getRoleByName(role);
      if (!roleData) {
        throw new BadRequestException('Invalid role specified.');
      }

      await this.usersRepository.registerAccount(createUserDto, roleData);
    } catch (error) {
      this.logger.log(
        'sign-up',
        'error',
        `Registration error: ${error}`,
        'auth.service',
      );
      throw error instanceof BadRequestException
        ? error
        : error instanceof ConflictException
          ? error
          : new InternalServerErrorException(
              'Something went wrong while creating the user account',
            );
    }
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
    session: any,
  ): Promise<{ accessToken: string; refreshToken: string } & User> {
    const { email, password, otp } = authCredentialsDto;

    const normalizedEmail = email.toLowerCase();

    const user = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    if (
      user?.userRole?.name === RolesConstant.ADMIN ||
      user?.userRole?.name === RolesConstant.SUPER_ADMIN
    ) {
      throw new UnauthorizedException(
        'Admin accounts cannot log in through this endpoint. Please use the admin panel.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'This account is yet to be confirmed. Request a confirmation email.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Wrong email/password. Please check your login credentials',
      );
    }

    const payload: JwtPayload = {
      email: normalizedEmail,
      role: user.userRole,
    };

    const accessToken: string = await this.jwtService.sign(payload);

    const refreshToken: string = await this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    delete user.password;

    session.currentUser = {
      ...user,
    };

    await this.cacheService.set(
      `session:${user.id}:${accessToken}`,
      'active',
      60 * 60 * 24,
    );
    await this.cacheService.set(
      `refresh:${user.id}:${refreshToken}`,
      'active',
      60 * 60 * 24 * 7,
    );

    return { accessToken, refreshToken, ...user };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.getUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.cacheService.get(
      `refresh:${user.id}:${refreshToken}`,
    );
    if (isValid !== 'active') {
      throw new UnauthorizedException(
        'Refresh token is invalid or has been revoked',
      );
    }

    const newAccessToken = this.jwtService.sign(
      { email: user.email, role: user.userRole },
      { expiresIn: '15m' },
    );

    await this.cacheService.set(
      `session:${user.id}:${newAccessToken}`,
      'active',
      60 * 60 * 24,
    );

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.getUserByEmail(payload.email);
      if (user) {
        await this.cacheService.delete(`refresh:${user.id}:${refreshToken}`);
      }
    } catch {}
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    newPasswordDto: NewPasswordDto,
  ) {
    const { userId, token } = resetPasswordDto;
    const { newPassword } = newPasswordDto;

    const storedToken = await this.cacheService.get(`reset-password:${userId}`);
    if (!storedToken || storedToken !== token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await this.usersRepository.save(user);

    await this.cacheService.delete(`reset-password:${userId}`);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async getAllUsers(
    page = 1,
    perPage = 10,
    search: string,
    req: Request,
  ): Promise<any> {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<User>['where'] = search
        ? [{ email: ILike(`%${search}%`) }]
        : undefined;

      const [result, total] = await this.usersRepository.findAndCount({
        where,
        order: { email: 'ASC' },
        skip,
        take: perPage,
      });

      for (const user of result) delete user.password;

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException('Some thing went wrong: AS-ERROR');
    }
  }

  async createRole(accessDto: AccessDto) {
    return await this.userRoleRepository.createRole(accessDto);
  }

  async getAllRoles(
    page: number,
    perPage: number,
    search: string,
    req: Request,
  ) {
    return await this.userRoleRepository.getAllRoles(
      page,
      perPage,
      search,
      req,
    );
  }

  async getRoleById(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid Role ID');
    }
    return await this.userRoleRepository.getRoleById(id);
  }

  async createPrivilege(accessDto: AccessDto) {
    return await this.userPrivilegeRepository.createPrivilege(accessDto);
  }

  async getAllPrivileges(
    page: number,
    perPage: number,
    search: string,
    req: Request,
  ) {
    return await this.userPrivilegeRepository.getAllPrivileges(
      page,
      perPage,
      search,
      req,
    );
  }

  verifyJwt(token: string) {
    return this.jwtService.verify(token);
  }

  async findUserById(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException('This is not a valid ID');
    }
    return await this.usersRepository.findUserById(id);
  }

  async assignPrivilege(assignPrivilegeDto: AssignPrivilegeDto) {
    const { roleId, privilegeIds } = assignPrivilegeDto;
    try {
      const role = await this.userRoleRepository.findOne({
        where: { id: roleId },
        relations: ['userPrivileges'],
      });

      const availablePrivs = [];
      const unAvailablePrivs = [];
      privilegeIds.forEach(async (id) => {
        const privilege = await this.userPrivilegeRepository.findOne({
          where: { id },
        });
        if (privilege) {
          availablePrivs.push(privilege);
        } else {
          unAvailablePrivs.push(privilege);
        }
      });

      if (role) {
        role.userPrivileges = availablePrivs;
        await this.userRoleRepository.save(role);
      } else {
      }
    } catch (error) {}
  }
}
