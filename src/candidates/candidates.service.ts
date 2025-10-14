import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CandidateDto } from './dto/candidate.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private candidatesRepository: Repository<Candidate>,
  ) {}

  async processExcel(file: Express.Multer.File, name: string, surname: string): Promise<CandidateDto> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length !== 1) {
        throw new BadRequestException('El archivo Excel debe contener exactamente una fila de datos');
      }

      const excelData = data[0] as any;

      const seniority = (excelData.Seniority || excelData.seniority || '').toLowerCase();
      const years = Number(excelData['Years of experience'] || excelData.years || 0);
      const availability = Boolean(excelData.Availability ?? excelData.availability);

      if (!['junior', 'senior'].includes(seniority)) {
        throw new BadRequestException('Seniority debe ser "junior" o "senior"');
      }

      const candidate = this.candidatesRepository.create({
        name,
        surname,
        seniority: seniority as 'junior' | 'senior',
        years,
        availability,
      });

      await this.candidatesRepository.save(candidate);

      return {
        name: candidate.name,
        surname: candidate.surname,
        seniority: candidate.seniority,
        years: candidate.years,
        availability: candidate.availability,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error al procesar el archivo Excel: ' + error.message);
    }
  }

  async findAll(): Promise<CandidateDto[]> {
    const candidates = await this.candidatesRepository.find();
    return candidates.map(c => ({
      name: c.name,
      surname: c.surname,
      seniority: c.seniority,
      years: c.years,
      availability: c.availability,
    }));
  }
}