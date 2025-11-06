import { IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class GenerateCodeDto {
  @IsString()
  @IsNotEmpty()
  offerId!: string;

  @IsEmail()
  clientEmail!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchaseHintValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  channel?: string;
}
