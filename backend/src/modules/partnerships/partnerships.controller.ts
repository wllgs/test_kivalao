import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ListPartnerOffersDto } from '../offers/dto/list-partner-offers.dto';
import { OffersService } from '../offers/offers.service';
import { InvitePartnerDto } from './dto/invite-partner.dto';
import { PartnershipsService } from './partnerships.service';

@UseGuards(JwtAuthGuard)
@Controller('partnerships')
export class PartnershipsController {
  constructor(
    private readonly partnershipsService: PartnershipsService,
    private readonly offersService: OffersService,
  ) {}

  @Post('invite')
  invitePartner(@CurrentUser() user: AuthUser, @Body() dto: InvitePartnerDto) {
    return this.partnershipsService.invitePartner(user.id, dto);
  }

  @Patch('accept/:inviteToken')
  acceptInvite(@CurrentUser() user: AuthUser, @Param('inviteToken') inviteToken: string) {
    return this.partnershipsService.acceptInvitation(user.id, inviteToken);
  }

  @Get('offers')
  listPartnerOffers(@CurrentUser() user: AuthUser, @Query() query: ListPartnerOffersDto) {
    return this.offersService.listPartnerOffers(user.id, query);
  }
}
