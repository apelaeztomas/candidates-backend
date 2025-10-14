import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { BadRequestException } from '@nestjs/common';
import { CandidateDto } from './dto/candidate.dto';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let service: CandidatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: {
            processExcel: jest.fn(),
            getAllCandidates: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidatesController>(CandidatesController);
    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadCandidate', () => {
    const fileMock = {
      buffer: Buffer.from([]),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } as any;

    const name = 'Aitor';
    const surname = 'Pelaez';

    it('should throw BadRequestException if file is missing', async () => {
      await expect(controller.uploadCandidate(null as any, name, surname))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name or surname are missing', async () => {
      await expect(controller.uploadCandidate(fileMock, '', surname))
        .rejects.toThrow(BadRequestException);
      await expect(controller.uploadCandidate(fileMock, name, ''))
        .rejects.toThrow(BadRequestException);
    });

    it('should call service and return candidate on success', async () => {
      const candidateMock: CandidateDto = {
        name,
        surname,
        seniority: 'junior',
        years: 2,
        availability: true,
      };

      jest.spyOn(service, 'processExcel').mockResolvedValue(candidateMock as any);

      const result = await controller.uploadCandidate(fileMock, name, surname);

      expect(service.processExcel).toHaveBeenCalledWith(fileMock, name, surname);
      expect(result).toEqual(candidateMock);
    });
  });

  describe('getAll', () => {
    it('should return all candidates', async () => {
      const candidatesMock: CandidateDto[] = [
        { name: 'Aitor', surname: 'Pelaez', seniority: 'junior', years: 2, availability: true },
      ];

      jest.spyOn(service, 'getAllCandidates').mockResolvedValue(candidatesMock as any);

      const result = await controller.getAll();

      expect(service.getAllCandidates).toHaveBeenCalled();
      expect(result).toEqual(candidatesMock);
    });
  });
});