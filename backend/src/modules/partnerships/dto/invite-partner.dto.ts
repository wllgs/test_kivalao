import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class InvitePartnerDto {
  @IsEmail()
  inviteeEmail!: string;

  @IsString()
  @IsNotEmpty()
  inviteeCompany!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
