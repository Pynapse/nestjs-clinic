import { GetUserDto } from '@macc4-clinic/common';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorsService } from '../doctors/doctors.service';
import { ProfileService } from '../grpc/grpc-profile.service';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetMyAppointmentsResponseDto } from './dto/get-my-appointments-response.dto';
import { Appointment } from './entities/appointment.entity';
import { WORKING_HOURS } from './utils/constants';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentsRepository)
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
    private readonly profileService: ProfileService,
  ) {}

  //
  // Create a new resolution
  //

  async createAppointment(
    user: GetUserDto,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const patient = await this.patientsService.getPatientByUserId(user.id);

    const doctor = await this.doctorsService.getDoctorById(
      createAppointmentDto.doctorId,
    );

    // might be better suited in the dto
    createAppointmentDto.visitDate = new Date(createAppointmentDto.visitDate);

    // check if it is a day off

    // TODO

    // check if the appointment visitDate is within working hours

    const visitDateHour = new Date(createAppointmentDto.visitDate).getHours();

    if (
      visitDateHour < WORKING_HOURS.start ||
      visitDateHour > WORKING_HOURS.end
    ) {
      throw new BadRequestException(
        `Appointment time should be within working hours (${WORKING_HOURS.start} - ${WORKING_HOURS.end})`,
      );
    }

    // check if the visitDate is occupied or not

    let occupied: Appointment;

    try {
      occupied = await this.getAppointmentByDoctorIdAndVisitDate(
        createAppointmentDto.doctorId,
        createAppointmentDto.visitDate,
      );
    } catch (error) {}

    if (occupied) {
      throw new ConflictException('You must choose a free timeslot');
    }

    return this.appointmentsRepository.createAppointment(
      patient,
      doctor,
      createAppointmentDto,
    );
  }

  //
  // Get personal Appointments
  //

  async getMyAppointments(
    user: GetUserDto,
  ): Promise<GetMyAppointmentsResponseDto[]> {
    const appointments = await this.appointmentsRepository.getMyAppointments(
      user.id,
    );

    const patientUserIds: string[] = [
      ...new Set(
        appointments.map((appointment) => appointment.patientUserId.toString()),
      ),
    ];

    const doctorUserIds: string[] = [
      ...new Set(
        appointments.map((appointment) => appointment.doctorUserId.toString()),
      ),
    ];

    const userIds: string[] = patientUserIds.concat(doctorUserIds);

    const profiles = await this.profileService.getBatchProfiles(userIds);

    const appointmentsAndProfiles: GetMyAppointmentsResponseDto[] = [];

    appointments.forEach((appointment) => {
      const doctor = profiles.find(
        (profile) => profile.userId === appointment.doctorUserId,
      );

      appointment.doctorFirstName = doctor.firstName;
      appointment.doctorLastName = doctor.lastName;

      const patient = profiles.find(
        (profile) => profile.userId === appointment.patientUserId,
      );

      appointment.patientFirstName = patient.firstName;
      appointment.patientLastName = patient.lastName;

      appointmentsAndProfiles.push(appointment);
    });

    return appointments;
  }

  //
  // Get Appointment by id
  //

  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.getAppointmentById(
      id,
    );

    if (!appointment) {
      throw new NotFoundException(`No appointment found with ID: ${id}`);
    }

    return appointment;
  }

  //
  // Get Appointment by id
  //

  async getAppointmentByDoctorIdAndVisitDate(
    id: number,
    visitDate: Date,
  ): Promise<Appointment> {
    const date = visitDate.toISOString();

    const appointment =
      await this.appointmentsRepository.getAppointmentByDoctorIdAndVisitDate(
        id,
        date,
      );

    if (!appointment) {
      throw new NotFoundException(
        `No appointment found for date: ${date} and doctor (id ${id})`,
      );
    }

    return appointment;
  }
}
