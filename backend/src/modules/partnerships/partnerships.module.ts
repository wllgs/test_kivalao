import { Module } from '@nestjs/common';

import { OffersModule } from '../offers/offers.module';
import { PartnershipsController } from './partnerships.controller';
import { PartnershipsService } from './partnerships.service';

@Module({
  imports: [OffersModule],
  controllers: [PartnershipsController],
  providers: [PartnershipsService],
  exports: [PartnershipsService],
})
export class PartnershipsModule {}

