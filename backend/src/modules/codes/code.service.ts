import { HttpService } from '@nestjs/axios';
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CodeStatus, CommissionType, Prisma, TransactionStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

import { PrismaService } from '../../common/services/prisma.service';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';

@Injectable()
export class CodeService {
  private readonly logger = new Logger(CodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateCode(dto: GenerateCodeDto, issuerId: string, referringPartnerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: dto.offerId },
      include: { owner: true, targetAudience: true },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.targetAudienceId !== referringPartnerId) {
      throw new ForbiddenException('Offer is not intended for this partner');
    }

    const code = await this.prisma.generatedCode.create({
      data: {
        codeString: this.buildRandomCode(),
        offerId: dto.offerId,
        issuedById: issuerId,
        referringPartnerId,
        clientEmail: dto.clientEmail.toLowerCase(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : offer.validTo,
        purchaseHintValue: dto.purchaseHintValue
          ? new Prisma.Decimal(dto.purchaseHintValue.toFixed(2))
          : undefined,
        metadata: {
          channel: dto.channel ?? 'manual',
        },
      },
    });

    return code;
  }

  async validateCode(dto: ValidateCodeDto) {
    const now = new Date();

    if (!dto.redeemingPartnerId) {
      throw new BadRequestException('Missing redeeming partner context');
    }

    const { updatedCode, transaction } = await this.prisma.$transaction(async (tx) => {
      const codeRecord = await tx.generatedCode.findUnique({
        where: { codeString: dto.code },
        include: { offer: true },
      });

      if (!codeRecord) {
        throw new NotFoundException('Code inconnu');
      }

      if (codeRecord.status !== CodeStatus.ISSUED) {
        throw new BadRequestException('Code deja utilise ou inactif');
      }

      if (codeRecord.expiresAt && codeRecord.expiresAt < now) {
        throw new BadRequestException('Code expire');
      }

      if (codeRecord.offer.ownerId !== dto.redeemingPartnerId) {
        throw new ForbiddenException('Ce partenaire ne possede pas cette offre');
      }

      const redeemedCode = await tx.generatedCode.update({
        where: { id: codeRecord.id },
        data: {
          status: CodeStatus.REDEEMED,
          redeemedAt: now,
          redeemedById: dto.redeemingPartnerId,
          metadata: {
            ...(codeRecord.metadata ?? {}),
            channel: dto.channel ?? 'pos',
            posReference: dto.posReference,
          },
        },
        include: { offer: true },
      });

      const commissionAmount = this.calculateCommission(
        redeemedCode.offer.commissionType,
        redeemedCode.offer.commissionValue,
        dto.purchaseValue,
      );

      const transactionRecord = await tx.transaction.create({
        data: {
          codeId: redeemedCode.id,
          referringPartnerId: redeemedCode.referringPartnerId,
          redeemingPartnerId: dto.redeemingPartnerId,
          commissionAmount,
          currency: redeemedCode.offer.currency,
          saleAmount: new Prisma.Decimal(dto.purchaseValue.toFixed(2)),
          status: TransactionStatus.DUE,
          metadata: {
            channel: dto.channel,
            posReference: dto.posReference,
          },
        },
      });

      return { updatedCode: redeemedCode, transaction: transactionRecord };
    });

    await this.notifyRedemptionWebhook(transaction.id, updatedCode.codeString);

    return {
      code: {
        value: updatedCode.codeString,
        status: updatedCode.status,
        redeemedAt: updatedCode.redeemedAt,
        offerTitle: updatedCode.offer.title,
      },
      transaction,
    };
  }

  private calculateCommission(
    commissionType: CommissionType,
    commissionValue: Prisma.Decimal,
    purchaseValue: number,
  ): Prisma.Decimal {
    const numericValue = Number(commissionValue);
    let result = numericValue;

    if (commissionType === CommissionType.PERCENTAGE) {
      result = (purchaseValue * numericValue) / 100;
    }

    return new Prisma.Decimal(result.toFixed(2));
  }

  private buildRandomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async notifyRedemptionWebhook(transactionId: string, code: string): Promise<void> {
    const webhookUrl = this.configService.get<string>('N8N_NOTIFICATION_WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.warn('N8N_NOTIFICATION_WEBHOOK_URL not configured; skipping notification');
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          transactionId,
          code,
          source: 'kivalao-api',
          occurredAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to notify n8n for transaction ${transactionId}`, error as Error);
    }
  }
}
