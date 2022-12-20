import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from 'src/hospital/entities/hospital.entity';
import { Reservation } from './entities/reservation.entity';
import { Patient } from 'src/hospital/entities/patient.entity';
import { User } from 'src/user/entities/user.entity';

// 면회 예약 관련 처리에 사용되는 클래스들에 대한 표기
@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Hospital, User, Patient])],
  providers: [ReservationService],
  controllers: [ReservationController],
  exports: [ReservationService],
})
export class ReservationModule {}
