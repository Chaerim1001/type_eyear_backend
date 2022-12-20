import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';

// 신청한 면회에 대한 응답 데이터 클래스
class ReservationResponseData {
  @ApiProperty({ description: '신청된 예약 아이디', example: 1 })
  id: number;
}

export abstract class ReservationResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({
    description: 'response result',
    example: {
      id: 1,
    },
  })
  reservation: ReservationResponseData; // 신청된 면회의 id값을 응답으로 보내준다.
}
