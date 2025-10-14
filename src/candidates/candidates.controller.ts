import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import { CandidateDto } from './dto/candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('excel'))
  uploadCandidate(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('surname') surname: string,
  ): CandidateDto {
    // Validaciones
    if (!file) {
      throw new BadRequestException('El archivo Excel es requerido');
    }
    
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }
    
    if (!surname || surname.trim() === '') {
      throw new BadRequestException('El apellido es requerido');
    }
    
    // Valida tipo de archivo
    const validExtensions = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    if (!validExtensions.includes(file.mimetype)) {
      throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
    }
    
    // Procesa el archivo y devuelve el candidato
    return this.candidatesService.processExcel(file, name, surname);
  }
}