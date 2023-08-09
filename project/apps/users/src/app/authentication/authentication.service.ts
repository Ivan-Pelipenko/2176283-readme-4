import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BlogUserMemoryRepository } from '../blog-user/blog-user-memory.repository';
import { CreateUserDto } from './dto/create-user.dto';
import {AUTH_USER_EXISTS, AUTH_USER_NOT_FOUND, AUTH_USER_PASSWORD_WRONG} from './authentication.constant';
import { BlogUserEntity } from '../blog-user/blog-user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { dbConfig } from '@project/config/config-users';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly blogUserRepository: BlogUserMemoryRepository,

    @Inject(dbConfig.KEY)
    private readonly databaseConfig: ConfigType<typeof dbConfig>,
  ) {
    //извлекаем настройки из конфигурации
    console.log(databaseConfig.host);
    console.log(databaseConfig.user);
  }

  public async register(dto: CreateUserDto) {
    const {email, name, password} = dto;

    const blogUser = {
      email, name, passwordHash: '', avatar: ''
    };

    const existUser = await this.blogUserRepository
      .findByEmail(email);

    if (existUser) {
      throw new ConflictException(AUTH_USER_EXISTS);
    }

    const userEntity = await new BlogUserEntity(blogUser)
      .setPassword(password);

    return this.blogUserRepository.create(userEntity);
  }

  public async verifyUser(dto: LoginUserDto) {
    const {email, password} = dto;
    const existUser = await this.blogUserRepository.findByEmail(email);

    if (!existUser) {
      throw new NotFoundException(AUTH_USER_NOT_FOUND);
    }

    const blogUserEntity = new BlogUserEntity(existUser);
    if (!await blogUserEntity.comparePassword(password)) {
      throw new UnauthorizedException(AUTH_USER_PASSWORD_WRONG);
    }

    return blogUserEntity.toObject();
  }

  public async getUser(id: string) {
    return this.blogUserRepository.findById(id);
  }
}
