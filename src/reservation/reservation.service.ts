import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation) // Reservation 테이블 사용을 위한 의존성 주입
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(User) // User 테이블 사용을 위한 의존성 주입
    private userRepository: Repository<User>,
  ) {
    this.reservationRepository = reservationRepository;
    this.userRepository = userRepository;
  }

  async createReservation(
    // 면회 예약 처리 함수
    createReservationDto: CreateReservationDto,
    userId: number,
  ) {
    const user = await this.userRepository.findOne({
      // 면회를 신청한 사용자에 대한 추가 정보를 찾는다.
      where: {
        id: userId,
      },
      relations: {
        patient: true,
        hospital: true,
      },
    });

    // 사용자가 요청한 날짜, 시간에 이미 예약이 차있는지 확인한다.
    const isExist = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.hospitalId = :hospitalId', {
        hospitalId: user.hospital.id,
      })
      .andWhere(
        'date_format(reservation.reservationDate, "%Y-%m-%d") = :reservationDate',
        { reservationDate: createReservationDto.reservationDate },
      )
      .andWhere('reservation.timetableIndex =:timetableIndex', {
        timetableIndex: createReservationDto.timetableIndex,
      })
      .andWhere('reservation.approveCheck =:approve', { approve: 1 })
      .execute();

    if (isExist.length > 0) {
      // 예약이 차있을 경우 요청받은 면회를 저장하지 않는다.
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ['Already the others have reservation'],
        error: 'Forbidden',
      });
    }

    // 요청받은 날짜에 이미 신청한 면회가 있는지 확인한다.
    const overlapReservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.hospitalId = :hospitalId', {
        hospitalId: user.hospital.id,
      })
      .andWhere(
        'date_format(reservation.reservationDate, "%Y-%m-%d") = :reservationDate',
        { reservationDate: createReservationDto.reservationDate },
      )
      .andWhere('reservation.userId =:userId', { userId })
      .execute();

    // 이미 신청한 면회가 있는 경우 요청받은 면회를 저장하지 않는다.
    if (overlapReservation.length > 0) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ['Already you have reservation on this day'],
        error: 'Forbidden',
      });
    }

    // 면회 예약
    const result = await this.reservationRepository
      .createQueryBuilder()
      .insert()
      .into(Reservation)
      .values({
        reservationDate: () => `'${createReservationDto.reservationDate}'`,
        timetableIndex: () => `${createReservationDto.timetableIndex}`,
        faceToface: () => `${createReservationDto.faceToface}`,
        hospital: () => `'${user.hospital.id}'`,
        user: () => `'${user.id}'`,
        patient: () => `'${user.patient.id}'`,
      })
      .execute();

    return { id: result.identifiers[0].id };
  }

  // 신청한 면회 리스트에 대한 요청 처리 함수
  async getReservationList(userId: number) {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('reservation.id')
      .addSelect('reservation.createdAt')
      .addSelect('reservation.reservationDate')
      .addSelect('reservation.timetableIndex')
      .addSelect('reservation.faceToface')
      .addSelect('reservation.approveCheck')
      .where('reservation.user =:userId', { userId })
      .orderBy('reservation.reservationDate', 'ASC')
      .execute();

    const result = { '-1': [], '0': [], '1': [] };

    for (const reservation of reservations) {
      reservation.reservation_reservationDate = this.formatDate(
        reservation.reservation_reservationDate,
      );

      reservation.reservation_createdAt = this.formatDate(
        reservation.reservation_createdAt,
      );

      result[reservation.reservation_approveCheck].push(reservation);
    }

    return result;
  }

  // 날짜 데이터를 특정 포맷으로 변경해주는 함수
  formatDate(dateTypeData: Date) {
    const temp1 = dateTypeData.toISOString().split('T')[0];
    const temp2 = temp1.split('-');

    return temp2[0].substring(2) + '/' + temp2[1] + '/' + temp2[2];
  }
}
