import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type Seniority = 'junior' | 'senior';

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ type: 'enum', enum: ['junior', 'senior'] })
  seniority: Seniority;

  @Column('int')
  years: number;

  @Column('boolean')
  availability: boolean;
}