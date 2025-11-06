import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { CodeService } from './code.service';

@UseGuards(JwtAuthGuard)
@Controller('code')
export class CodesController {
  constructor(private readonly codeService: CodeService) {}

  @Post('generate')
  generateCode(@CurrentUser() user: AuthUser, @Body() dto: GenerateCodeDto) {
    return this.codeService.generateCode(dto, user.id, user.id);
  }

  @Post('validate')
  validateCode(@CurrentUser() user: AuthUser, @Body() dto: ValidateCodeDto) {
    return this.codeService.validateCode({
      ...dto,
      redeemingPartnerId: user.id,
    });
  }
}

