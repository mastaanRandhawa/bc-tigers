import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** Fields an admin may PATCH on a user. Role and password are managed elsewhere. */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
