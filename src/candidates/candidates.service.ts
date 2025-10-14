import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CandidateDto } from './dto/candidate.dto';

@Injectable()
export class CandidatesService {
  processExcel(file: Express.Multer.File, name: string, surname: string): CandidateDto {
    try {
      // Lee el excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      // Primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convierte a JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // Valida que hay exactamente una línea
      if (data.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío');
      }
      
      if (data.length > 1) {
        throw new BadRequestException('El archivo Excel debe contener solo una línea de datos');
      }
      
      const excelData = data[0] as any;
      
      // Valida campos requeridos
      if (!excelData.Seniority && !excelData.seniority) {
        throw new BadRequestException('Falta el campo Seniority en el Excel');
      }
      
      if (excelData['Years of experience'] === undefined && excelData.years === undefined) {
        throw new BadRequestException('Falta el campo Years of experience en el Excel');
      }
      
      if (excelData.Availability === undefined && excelData.availability === undefined) {
        throw new BadRequestException('Falta el campo Availability en el Excel');
      }
      
      // Obtiene valores
      const seniority = (excelData.Seniority || excelData.seniority || '').toString().toLowerCase();
      const years = Number(excelData['Years of experience'] || excelData.years || 0);
      const availability = Boolean(excelData.Availability ?? excelData.availability);
      
      // Valida el rango
      if (seniority !== 'junior' && seniority !== 'senior') {
        throw new BadRequestException('Seniority debe ser "junior" o "senior"');
      }
      
      // Respuesta
      const candidate: CandidateDto = {
        name,
        surname,
        seniority: seniority as 'junior' | 'senior',
        years,
        availability,
      };
      
      return candidate;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al procesar el archivo Excel: ' + error.message);
    }
  }
}