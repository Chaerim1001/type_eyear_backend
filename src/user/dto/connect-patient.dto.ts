import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 개인과 환자 연결에 사용하는 요청 데이터 클래스
export class ConnectPatientDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '병원 아이디', example: 1 })
  hospital_id: number; // 환자가 속한 병원 아이디

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '환자 이름' })
  patient_name: string; // 환자 이름

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '주민번호 앞자리', example: '661010' })
  patient_infoNumber: string; // 환자 주민번호 앞 여섯자리
}
