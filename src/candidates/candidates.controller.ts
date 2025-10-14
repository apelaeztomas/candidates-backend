import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, Get, Param, Put, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { CandidateDto, UploadCandidateDto } from './dto/candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('excel'))
  async uploadCandidate(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('surname') surname: string,
  ): Promise<CandidateDto> {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (!name || !surname) throw new BadRequestException('Nombre y apellido requeridos');

    const candidate = await this.candidatesService.processExcel(file, name, surname);
    return this.toDto(candidate);
  }

  @Get()
  async getAll(): Promise<CandidateDto[]> {
    const candidates = await this.candidatesService.getAllCandidates();
    return candidates.map(c => this.toDto(c));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() update: Partial<CandidateDto>,
  ): Promise<CandidateDto> {
    const candidate = await this.candidatesService.updateCandidate(id, update);
    return this.toDto(candidate);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.candidatesService.deleteCandidate(id);
    return { message: 'Candidato eliminado correctamente' };
  }

  private toDto(candidate: any): CandidateDto & { id?: string } {
		return {
			id: candidate.id,               
			name: candidate.name,
			surname: candidate.surname,
			seniority: candidate.seniority as 'junior' | 'senior',
			years: candidate.years,
			availability: candidate.availability,
		};
	}

}
