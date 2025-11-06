import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';

import { PrismaService } from '../../common/services/prisma.service';

interface BalanceSnapshot {
  netBalance: number;
  youAreOwed: number;
  youOwe: number;
  recentTransactions: Array<{
    id: string;
    code: string;
    role: 'REFERRER' | 'REDEEMER';
    commissionAmount: number;
    status: TransactionStatus;
    occurredAt: Date;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateNetBalance(userId: string): Promise<BalanceSnapshot> {
    const [owedAggregate, oweAggregate, recentTransactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { commissionAmount: true },
        where: {
          referringPartnerId: userId,
          status: { notIn: [TransactionStatus.VOID] },
        },
      }),
      this.prisma.transaction.aggregate({
        _sum: { commissionAmount: true },
        where: {
          redeemingPartnerId: userId,
          status: { in: [TransactionStatus.DUE, TransactionStatus.PARTIALLY_PAID] },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          OR: [
            { referringPartnerId: userId },
            { redeemingPartnerId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          code: {
            select: { codeString: true },
          },
        },
      }),
    ]);

    const youAreOwed = this.decimalToNumber(owedAggregate._sum.commissionAmount);
    const youOwe = this.decimalToNumber(oweAggregate._sum.commissionAmount);

    return {
      netBalance: Number((youAreOwed - youOwe).toFixed(2)),
      youAreOwed,
      youOwe,
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        code: transaction.code.codeString,
        role: transaction.referringPartnerId === userId ? 'REFERRER' : 'REDEEMER',
        commissionAmount: this.decimalToNumber(transaction.commissionAmount),
        status: transaction.status,
        occurredAt: transaction.createdAt,
      })),
    };
  }

  private decimalToNumber(value?: Prisma.Decimal | null): number {
    return value ? Number(value.toFixed(2)) : 0;
  }
}
