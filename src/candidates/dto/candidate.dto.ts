export class CandidateDto {
  name: string;
  surname: string;
  seniority: 'junior' | 'senior';
  years: number;
  availability: boolean;
}

export class UploadCandidateDto {
  name: string;
  surname: string;
}