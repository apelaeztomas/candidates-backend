import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { BadRequestException } from '@nestjs/common';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let repo: Partial<Record<keyof Repository<Candidate>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getRepositoryToken(Candidate),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if Excel is empty', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = { buffer: fileBuffer } as any;

    await expect(service.processExcel(file, 'Aitor', 'Pelaez')).rejects.toThrow(BadRequestException);
  });

  it('should throw error if seniority is missing', async () => {
    const ws = XLSX.utils.aoa_to_sheet([['Years of experience', 'Availability'], [3, true]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = { buffer: fileBuffer } as any;

    await expect(service.processExcel(file, 'Aitor', 'Pelaez')).rejects.toThrow('Falta el campo Seniority');
  });

  it('should throw error if seniority is invalid', async () => {
    const ws = XLSX.utils.aoa_to_sheet([['Seniority','Years of experience','Availability'], ['middle', 2, true]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = { buffer: fileBuffer } as any;

    await expect(service.processExcel(file, 'Aitor', 'Pelaez')).rejects.toThrow('Seniority debe ser "junior" o "senior"');
  });

  it('should create candidate if Excel is correct', async () => {
    const ws = XLSX.utils.aoa_to_sheet([['Seniority','Years of experience','Availability'], ['junior', 2, true]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = { buffer: fileBuffer } as any;

    const mockCandidate = { name: 'Aitor', surname: 'Pelaez', seniority: 'junior', years: 2, availability: true };
    (repo.create as jest.Mock).mockReturnValue(mockCandidate);
    (repo.save as jest.Mock).mockResolvedValue(mockCandidate);

    const candidate = await service.processExcel(file, 'Aitor', 'Pelaez');
    expect(candidate).toEqual(mockCandidate);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Aitor', surname: 'Pelaez', seniority: 'junior', years: 2, availability: true });
    expect(repo.save).toHaveBeenCalledWith(mockCandidate);
  });

  it('getAllCandidates should return all', async () => {
    const mockData = [{ name: 'Aitor', surname: 'Pelaez', seniority: 'junior', years: 2, availability: true }];
    (repo.find as jest.Mock).mockResolvedValue(mockData as any);

    const result = await service.getAllCandidates();
    expect(result).toEqual(mockData);
  });
});