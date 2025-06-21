import { Module, Scope } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseService } from './database.service'
import { DATA_SOURCE_DEFAULT, DEFAULT_CONNECTION_ALIAS } from 'src/shared'

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: DATA_SOURCE_DEFAULT,
      inject: [DatabaseService],
      scope: Scope.REQUEST,
      useFactory: (dbService: DatabaseService) =>
        dbService.getDataSource(DEFAULT_CONNECTION_ALIAS),
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
