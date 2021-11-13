import { Metadata } from '@grpc/grpc-js';
import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import ProfileGRPCService from './interfaces/profile.service.interface';

@Controller('profile')
export class ProfileService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject('PROFILE_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  private profileService: ProfileGRPCService;

  onModuleInit() {
    this.profileService =
      this.client.getService<ProfileGRPCService>('ProfileGRPCService');
  }

  async getProfileByUserId(userId: string): Promise<any> {
    const metadata = new Metadata();

    metadata.set('token', this.configService.get('JWT_SECRET'));

    const profile = await lastValueFrom(
      this.profileService.getProfileByUserId({ userId }, metadata),
    );

    return profile;
  }

  async getBatchProfiles(userIds: string[]): Promise<any> {
    const metadata = new Metadata();

    metadata.set('token', this.configService.get('JWT_SECRET'));

    const { profiles } = await lastValueFrom(
      this.profileService.getBatchProfiles({ userIds }, metadata),
    );

    return profiles;
  }
}
