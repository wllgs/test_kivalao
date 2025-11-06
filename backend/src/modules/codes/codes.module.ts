import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CodesController } from './codes.controller';
import { CodeService } from './code.service';

@Module({
  imports: [HttpModule],
  controllers: [CodesController],
  providers: [CodeService],
})
export class CodesModule {}

