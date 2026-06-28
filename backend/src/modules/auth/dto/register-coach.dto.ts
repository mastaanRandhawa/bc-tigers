import { IsArray, IsEmail, IsOptional, IsString, IsUUID, MinLength, ArrayMinSize } from 'class-validator';

export class RegisterCoachDto {
  @IsString()
  @MinLength(1)
  first_name!: string;

  @IsString()
  @MinLength(1)
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  /** @deprecated Use team_ids — kept for backward compatibility */
  @IsOptional()
  @IsString()
  coaching_request?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  team_ids!: string[];
}
