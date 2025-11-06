import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionForUser(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        code: {
          select: {
            codeString: true,
          },
        },
        referringPartner: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
        redeemingPartner: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.referringPartnerId !== userId && transaction.redeemingPartnerId !== userId) {
      throw new ForbiddenException('You cannot view this transaction');
    }

    return transaction;
  }
}

