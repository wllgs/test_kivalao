import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Partnership, PartnershipStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../common/services/prisma.service';
import { InvitePartnerDto } from './dto/invite-partner.dto';

@Injectable()
export class PartnershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async invitePartner(inviterId: string, dto: InvitePartnerDto): Promise<Partnership> {
    const invitee = await this.prisma.user.findUnique({
      where: { email: dto.inviteeEmail.toLowerCase() },
    });

    if (!invitee) {
      throw new NotFoundException('Invitee must register before accepting invitations');
    }

    if (invitee.id === inviterId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existingPartnership = await this.prisma.partnership.findFirst({
      where: {
        OR: [
          { partnerAId: inviterId, partnerBId: invitee.id },
          { partnerAId: invitee.id, partnerBId: inviterId },
        ],
      },
    });

    if (existingPartnership) {
      throw new BadRequestException('A partnership already exists between these partners');
    }

    const partnership = await this.prisma.partnership.create({
      data: {
        partnerAId: inviterId,
        partnerBId: invitee.id,
        status: PartnershipStatus.PENDING,
        inviteToken: randomUUID(),
        metadata: {
          note: dto.note,
          inviteeCompany: dto.inviteeCompany,
        },
      },
    });

    return partnership;
  }

  async acceptInvitation(currentUserId: string, inviteToken: string): Promise<Partnership> {
    const partnership = await this.prisma.partnership.findUnique({
      where: { inviteToken },
    });

    if (!partnership) {
      throw new NotFoundException('Invitation introuvable');
    }

    if (partnership.partnerBId !== currentUserId) {
      throw new ForbiddenException('Seul le partenaire invite peut accepter');
    }

    if (partnership.status === PartnershipStatus.ACTIVE) {
      return partnership;
    }

    return this.prisma.partnership.update({
      where: { id: partnership.id },
      data: {
        status: PartnershipStatus.ACTIVE,
        activatedAt: new Date(),
      },
    });
  }
}

