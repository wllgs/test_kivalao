import { IsOptional, IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  inviteToken!: string;

  @IsOptional()
  @IsString()
  posReference?: string;
}
