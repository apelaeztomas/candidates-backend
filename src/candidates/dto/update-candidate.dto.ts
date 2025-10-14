import { IsOptional, IsString, IsIn, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  @IsIn(['junior', 'senior'])
  seniority?: 'junior' | 'senior';

  @IsOptional()
  @IsNumber()
  years?: number;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;
}
