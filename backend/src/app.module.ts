import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { CodesModule } from './modules/codes/codes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OffersModule } from './modules/offers/offers.module';
import { PartnershipsModule } from './modules/partnerships/partnerships.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    PartnershipsModule,
    OffersModule,
    CodesModule,
    DashboardModule,
    TransactionsModule,
  ],
})
export class AppModule {}

