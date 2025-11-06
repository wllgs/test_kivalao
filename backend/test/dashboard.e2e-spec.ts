import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, TransactionStatus } from '@prisma/client';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PrismaService } from '../src/common/services/prisma.service';

describe('Dashboard balance (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof buildDashboardPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildDashboardPrismaMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = {
            id: 'partner-a',
            email: 'a@kivalao.app',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the aggregated dashboard balance and transaction feed', async () => {
    const response = await request(app.getHttpServer()).get('/dashboard/balance').expect(200);

    expect(response.body.netBalance).toBe(50);
    expect(response.body.youAreOwed).toBe(80);
    expect(response.body.youOwe).toBe(30);
    expect(response.body.recentTransactions).toHaveLength(2);
    expect(prismaMock.transaction.aggregate).toHaveBeenCalledTimes(2);
  });
});

function buildDashboardPrismaMock() {
  const aggregateMock = jest.fn().mockImplementation((params) => {
    if (params.where?.referringPartnerId) {
      return Promise.resolve({
        _sum: { commissionAmount: new Prisma.Decimal(80) },
      });
    }

    return Promise.resolve({
      _sum: { commissionAmount: new Prisma.Decimal(30) },
    });
  });

  const recentTransactions = [
    {
      id: 'txn-1',
      code: { codeString: 'KIVA01' },
      referringPartnerId: 'partner-a',
      redeemingPartnerId: 'partner-b',
      commissionAmount: new Prisma.Decimal(50),
      status: TransactionStatus.DUE,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'txn-2',
      code: { codeString: 'SNOW33' },
      referringPartnerId: 'partner-c',
      redeemingPartnerId: 'partner-a',
      commissionAmount: new Prisma.Decimal(30),
      status: TransactionStatus.PARTIALLY_PAID,
      createdAt: new Date('2024-01-05T00:00:00Z'),
    },
  ];

  return {
    transaction: {
      aggregate: aggregateMock,
      findMany: jest.fn().mockResolvedValue(recentTransactions),
    },
  };
}

