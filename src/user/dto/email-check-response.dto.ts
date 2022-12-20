import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';

// 이메일 중복 확인 요청에 사용하는 데이터 클래스
export abstract class EamilCheckResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({ description: 'response result', example: false })
  isValidEmail: boolean; // 사용 가능한 이메일인지
}
