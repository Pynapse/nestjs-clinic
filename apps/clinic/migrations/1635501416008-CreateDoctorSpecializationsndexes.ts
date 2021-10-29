import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorSpecializationsndexes1635501416008
  implements MigrationInterface
{
  name = 'CreateDoctorSpecializationsndexes1635501416008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE INDEX IDX_doctor_specializations_doctor_id ON clinic.doctor_specializations (doctor_id)
    `);

    await queryRunner.query(`
    CREATE INDEX IDX_doctor_specializations_specialization_id ON clinic.doctor_specializations (specialization_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    DROP INDEX clinic.IDX_doctor_specializations_specialization_id
    `);

    await queryRunner.query(`
    DROP INDEX clinic.IDX_doctor_specializations_doctor_id
    `);
  }
}
