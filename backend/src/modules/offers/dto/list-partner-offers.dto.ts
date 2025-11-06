import { IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class ListPartnerOffersDto {
  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsOptional()
  @IsPositive()
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Min(0)
  offset?: number = 0;
}
