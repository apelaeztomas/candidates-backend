import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CandidateDto } from './dto/candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  async processExcel(file: Express.Multer.File, name: string, surname: string): Promise<Candidate> {
    try {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) throw new BadRequestException('El archivo Excel está vacío');
    if (data.length > 1) throw new BadRequestException('El archivo Excel debe contener solo una línea de datos');

    const excelData = data[0] as any;

    if (!excelData.Seniority && !excelData.seniority) throw new BadRequestException('Falta el campo Seniority');
    if (excelData['Years of experience'] === undefined && excelData.years === undefined) throw new BadRequestException('Falta el campo Years of experience');
    if (excelData.Availability === undefined && excelData.availability === undefined) throw new BadRequestException('Falta el campo Availability');

      const seniority = (excelData.Seniority || excelData.seniority || '').toLowerCase();
      const years = Number(excelData['Years of experience'] || excelData.years || 0);
      const availability = Boolean(excelData.Availability ?? excelData.availability);

    if (!['junior', 'senior'].includes(seniority)) {
        throw new BadRequestException('Seniority debe ser "junior" o "senior"');
    }


      const candidate = this.candidateRepo.create({ name, surname, seniority, years, availability });
      return await this.candidateRepo.save(candidate);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error al procesar el archivo Excel: ' + error.message);
    }
  }

  getAllCandidates(): Promise<Candidate[]> {
    return this.candidateRepo.find();
  }
}