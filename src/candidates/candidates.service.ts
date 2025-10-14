import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

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

      // Validar Seniority
      const seniorityRaw = excelData.Seniority ?? excelData.seniority;
      if (!seniorityRaw) throw new BadRequestException('Falta el campo Seniority');
      const seniority = String(seniorityRaw).toLowerCase();
      if (!['junior', 'senior'].includes(seniority)) {
        throw new BadRequestException(
          `Valor inválido en 'Seniority': "${seniorityRaw}". Debe ser "junior" o "senior".`
        );
      }

      // Validar Years
      const yearsRaw = excelData['Years of experience'] ?? excelData.years;
      if (yearsRaw === undefined) throw new BadRequestException('Falta el campo Years of experience');
      const years = Number(yearsRaw);
      if (isNaN(years)) {
        throw new BadRequestException(
          `Valor inválido en 'Years of experience': "${yearsRaw}". Debe ser un número.`
        );
      }

      // Validar Availability
      const availabilityRaw = excelData.Availability ?? excelData.availability;
      if (availabilityRaw === undefined) throw new BadRequestException('Falta el campo Availability');
      const availability = availabilityRaw === true || availabilityRaw === 'true';
      if (typeof availability !== 'boolean') {
        throw new BadRequestException(
          `Valor inválido en 'Availability': "${availabilityRaw}". Debe ser true o false.`
        );
      }

      // Crear candidato
      const candidate = this.candidateRepo.create({
        name,
        surname,
        seniority: seniority as 'junior' | 'senior',
        years,
        availability,
      });

      return await this.candidateRepo.save(candidate);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error al procesar el archivo Excel: ' + error.message);
    }
  }

  async updateCandidate(id: string, update: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new BadRequestException('Candidato no encontrado');

    // Validaciones adicionales en service (por si viene raw data)
    if (update.seniority !== undefined) {
      const s = String(update.seniority).toLowerCase();
      if (!['junior', 'senior'].includes(s)) {
        throw new BadRequestException('Seniority debe ser "junior" o "senior"');
      }
      update.seniority = s as any;
    }

    if (update.years !== undefined) {
      const y = Number(update.years);
      if (Number.isNaN(y)) throw new BadRequestException('Years debe ser un número');
      update.years = y as any;
    }

    if (update.availability !== undefined) {
      // normalize boolean-like values
      if (typeof update.availability === 'string') {
        const v = (update.availability as string).toLowerCase();
        update.availability = v === 'true' || v === '1';
      } else {
        update.availability = Boolean(update.availability) as any;
      }
    }

    Object.assign(candidate, update);
    return this.candidateRepo.save(candidate);
  }

  async deleteCandidate(id: string): Promise<void> {
    const result = await this.candidateRepo.delete({ id });
    if (result.affected === 0) throw new BadRequestException('Candidato no encontrado');
  }
	
  getAllCandidates(): Promise<Candidate[]> {
    return this.candidateRepo.find();
  }
}