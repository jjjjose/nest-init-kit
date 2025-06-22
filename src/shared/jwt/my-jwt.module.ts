import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvService } from '../services'
import { getJwtConfig } from 'src/config/jwt.config'
import { MyJwtService } from './my-jwt.service'

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (env: EnvService) => getJwtConfig(env),
      inject: [EnvService],
    }),
  ],
  providers: [MyJwtService],
  exports: [MyJwtService],
})
export class MyJwtModule {}
