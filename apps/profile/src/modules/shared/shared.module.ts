import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configValidationSchema } from '../../config/config.schema';
import { JwtStrategy } from '@macc4-clinic/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env`],
      validationSchema: configValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        logging: true,
        synchronize: false,
        migrationsRun: true,
        entities: [__dirname + './../**/entities/*.{js,ts}'],
        migrations: [__dirname + './../../../migrations/*.{js,ts}'],
      }),
    }),
  ],
  providers: [
    {
      provide: 'AUTH_STRATEGY',
      useFactory: (configService: ConfigService) => {
        const secret = configService.get('JWT_SECRET');
        return new JwtStrategy({ secret });
      },
      inject: [ConfigService],
    },
  ],
})
export class SharedModule {}
