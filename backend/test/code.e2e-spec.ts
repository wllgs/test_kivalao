import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CodeStatus, CommissionType, Prisma, TransactionStatus } from '@prisma/client';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PrismaService } from '../src/common/services/prisma.service';

describe('Code redemption (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          context.switchToHttp().getRequest().user = {
            id: 'partner-b',
            email: 'b@kivalao.app',
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

  it('validates a code and persists the commission transaction', async () => {
    const response = await request(app.getHttpServer())
      .post('/code/validate')
      .send({
        code: 'KIVA01',
        purchaseValue: 120,
        channel: 'pos',
      })
      .expect(201);

    expect(response.body.code.value).toBe('KIVA01');
    expect(response.body.transaction.id).toBe('txn-1');
    expect(response.body.transaction.commissionAmount).toBe('12.00');
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});

function buildPrismaMock() {
  const offer = {
    id: 'offer-1',
    title: 'Suite Panoramique',
    ownerId: 'partner-b',
    commissionType: CommissionType.PERCENTAGE,
    commissionValue: new Prisma.Decimal(10),
    currency: 'EUR',
  };

  const codeRecord = {
    id: 'code-1',
    codeString: 'KIVA01',
    status: CodeStatus.ISSUED,
    expiresAt: null,
    offer,
    offerId: offer.id,
    referringPartnerId: 'partner-a',
    metadata: {},
  };

  const redeemedCode = {
    ...codeRecord,
    status: CodeStatus.REDEEMED,
    redeemedAt: new Date(),
  };

  const transactionRecord = {
    id: 'txn-1',
    codeId: redeemedCode.id,
    referringPartnerId: 'partner-a',
    redeemingPartnerId: 'partner-b',
    commissionAmount: new Prisma.Decimal(12),
    currency: 'EUR',
    saleAmount: new Prisma.Decimal(120),
    status: TransactionStatus.DUE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const transactionDelegate = {
    create: jest.fn().mockResolvedValue(transactionRecord),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  };

  const generatedCodeDelegate = {
    findUnique: jest.fn().mockResolvedValue(codeRecord),
    update: jest.fn().mockResolvedValue(redeemedCode),
  };

  return {
    $transaction: jest.fn().mockImplementation(async (callback) =>
      callback({
        generatedCode: generatedCodeDelegate,
        transaction: transactionDelegate,
      }),
    ),
    generatedCode: generatedCodeDelegate,
    transaction: transactionDelegate,
  };
}

