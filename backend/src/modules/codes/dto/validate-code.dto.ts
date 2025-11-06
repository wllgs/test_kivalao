import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class ValidateCodeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  redeemingPartnerId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchaseValue!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  posReference?: string;
}
