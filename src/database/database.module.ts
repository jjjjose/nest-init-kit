import { Global, Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { DATA_SOURCE_DEFAULT, DEFAULT_CONNECTION_ALIAS } from 'src/shared'

@Global()
@Module({
  providers: [
    DatabaseService,
    {
      provide: DATA_SOURCE_DEFAULT,
      inject: [DatabaseService],
      useFactory: (dbService: DatabaseService) => dbService.getDataSource(DEFAULT_CONNECTION_ALIAS),
    },
  ],
  exports: [DATA_SOURCE_DEFAULT],
})
export class DatabaseModule {}
