import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { CandidateDto, UploadCandidateDto } from './dto/candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('excel'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async uploadCandidate(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadCandidateDto,
  ): Promise<CandidateDto> {
    const { name, surname } = body;

    if (!file) throw new BadRequestException('El archivo Excel es requerido');

    const validExtensions = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validExtensions.includes(file.mimetype)) {
      throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
    }

    return this.candidatesService.processExcel(file, name, surname);
  }

  @Get()
  async getAllCandidates(): Promise<CandidateDto[]> {
    return this.candidatesService.findAll();
  }
}