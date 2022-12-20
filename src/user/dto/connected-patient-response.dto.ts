import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';

// 환자와 개인을 연결한 후 응답 데이터 클래스
class User {
  // user 정보
  @ApiProperty({ description: '개인 아이디', example: 5 })
  id: number; // user 고유 id
}

class Patient {
  // 환자 정보
  @ApiProperty({ description: '환자 아이디', example: 5 })
  id: number; // 환자 고유 id

  @ApiProperty({ description: '환자 이름', example: '이필재' })
  name: string; // 환자 이름

  @ApiProperty({ description: '환자 번호', example: 'PA1234' })
  number: string; // 환자 번호

  @ApiProperty({
    description: '환자 입원 날짜',
    example: '2019-10-12',
  })
  inDate: string; // 환자 입원날짜

  @ApiProperty({ description: '환자 주민 번호', example: '661002-1******' })
  infoNumber: string; // 환자 주민번호
}

class Hospital {
  // 환자가 속한 병원 정보
  @ApiProperty({ description: '병원 아이디', example: 5 })
  id: number; // 병원 고유 id

  @ApiProperty({ description: '병원 이름', example: '참나무 병원' })
  name: string; // 병원 이름

  @ApiProperty({ description: '병원 전화번호', example: '02-123-1234' })
  phoneNumber: string; // 병원 전화번호

  @ApiProperty({ description: '병원 주소', example: '서울시 중랑구' })
  address: string; // 병원 주소
}

class ResponseData {
  @ApiProperty({ description: '개인 데이터' })
  user: User;

  @ApiProperty({ description: '환자 데이터' })
  patient: Patient;

  @ApiProperty({ description: '병원 데이터' })
  hospital: Hospital;
}

export abstract class ConnectedPatientResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({
    description: 'response result',
    example: {
      user: {
        id: 11,
      },
      patient: {
        id: 5,
        number: 'BA13575',
        inDate: '2019-10-12',
        name: '이필재',
        infoNumber: '661002-1******',
      },
      hospital: {
        id: 2,
        name: '참나무 병원',
        address: '서울시 중랑구',
        phoneNumber: '02-123-1234',
      },
    },
  })
  result: ResponseData;
}
