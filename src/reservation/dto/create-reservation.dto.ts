import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateReservationDto {
  // 면회 예약에 사용하는 데이터 클래스
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({
    description: '예약 날짜',
    example: '2022-12-12',
  })
  reservationDate: Date; // 면회를 원하는 날짜

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '면회 시간대 인덱스', example: 1 })
  timetableIndex: number; // 면회를 원하는 시간대

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: '대면/비대면 여부. T인 경우 대면',
    example: true,
  })
  faceToface: boolean; // 대면 비대면 여부 선택
}
