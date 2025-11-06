import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OfferStatus, PartnershipStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../common/services/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { ListPartnerOffersDto } from './dto/list-partner-offers.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOffer(ownerId: string, dto: CreateOfferDto) {
    const partnership = await this.prisma.partnership.findFirst({
      where: {
        status: PartnershipStatus.ACTIVE,
        OR: [
          { partnerAId: ownerId, partnerBId: dto.targetPartnerId },
          { partnerAId: dto.targetPartnerId, partnerBId: ownerId },
        ],
      },
    });

    if (!partnership) {
      throw new ForbiddenException('No active partnership with this partner');
    }

    const offer = await this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId,
        targetAudienceId: dto.targetPartnerId,
        partnershipId: partnership.id,
        commissionType: dto.commissionType,
        commissionValue: new Prisma.Decimal(dto.commissionValue.toFixed(2)),
        currency: dto.currency ?? 'EUR',
        isStackable: dto.isStackable ?? false,
        maxPerClient: dto.maxPerClient,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });

    return offer;
  }

  async listPartnerOffers(userId: string, query: ListPartnerOffersDto) {
    const activePartners = await this.prisma.partnership.findMany({
      where: {
        status: PartnershipStatus.ACTIVE,
        OR: [
          { partnerAId: userId },
          { partnerBId: userId },
        ],
      },
    });

    if (activePartners.length === 0) {
      return [];
    }

    const partnerIds = new Set<string>();
    activePartners.forEach((relation) => {
      if (relation.partnerAId !== userId) {
        partnerIds.add(relation.partnerAId);
      }
      if (relation.partnerBId !== userId) {
        partnerIds.add(relation.partnerBId);
      }
    });

    if (query.partnerId && !partnerIds.has(query.partnerId)) {
      throw new NotFoundException('Partner not found in your network');
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        targetAudienceId: userId,
        status: OfferStatus.ACTIVE,
        ownerId: query.partnerId ? query.partnerId : { in: Array.from(partnerIds) },
      },
      include: {
        owner: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
      },
      skip: query.offset ?? 0,
      take: query.limit ?? 20,
      orderBy: { createdAt: 'desc' },
    });

    return offers;
  }
}

