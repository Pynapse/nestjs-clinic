import {
  EntityManager,
  EntityRepository,
  getManager,
  Repository,
} from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { GetResolutionsFilterDto } from './dto/get-resolutions-filter.dto';
import { Resolution } from './entities/resolution.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { PatchResolutionDto } from './dto/patch-resolution.dto';
import { Appointment } from '../appointments/entities/appointment.entity';

@EntityRepository(Resolution)
export class ResolutionsRepository extends Repository<Resolution> {
  constructor(private readonly pool: EntityManager = getManager()) {
    super();
  }
  //
  // Create a new resolution
  //

  async createResolution(
    createResolutionDto: CreateResolutionDto,
    patient: Patient,
    doctor: Doctor,
    appointment: Appointment,
  ): Promise<Resolution> {
    const resolution = this.create({
      patient,
      doctor,
      appointment,
      text: createResolutionDto.text,
    });

    await this.save(resolution);

    return resolution;
  }

  //
  // Get all resolutions with an optional query
  //

  async getResolutions(
    filterDto: GetResolutionsFilterDto,
  ): Promise<Resolution[]> {
    const { patientId, doctorId } = filterDto;
    const query = this.createQueryBuilder('resolution');

    if (patientId) {
      query.andWhere('resolution.patient_id = :patientId', { patientId });
    }

    if (doctorId) {
      query.andWhere('resolution.doctor_id = :doctorId', { doctorId });
    }

    const resolutions = await query.getMany();

    return resolutions;
  }

  //
  // Get personal resolutions
  //

  async getMyResolutions(id: string): Promise<Resolution[]> {
    const query = `
    SELECT resolutions.*
    FROM clinic.resolutions
    INNER JOIN clinic.patients
      ON patients.id = resolutions.patient_id
    WHERE patients.user_id='${id}';
    `;

    const resolution = await this.pool.query(query);

    return resolution;
  }

  //
  // Get resolution by id
  //

  async getResolutionById(id: number): Promise<Resolution> {
    const resolution = await this.findOne(id);

    return resolution;
  }

  //
  // Get resolution by id
  //

  async patchResolutionById(
    id: number,
    patchResolutionDto: PatchResolutionDto,
  ): Promise<Resolution> {
    const { text } = patchResolutionDto;

    const resolution = await this.findOne(id);

    resolution.text = text;

    return this.save(resolution);
  }

  //
  // Delete resolution by id
  //

  async deleteResolutionById(id: number): Promise<number> {
    const resolution = await this.delete(id);

    return resolution.affected;
  }
}
