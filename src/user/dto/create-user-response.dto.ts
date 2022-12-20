import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';

// 회원가입 응답 데이터에 대한 클래스
class CreateUserResponseData {
  email: string; // 이메일
  name: string; // 사용자 이름
  phoneNumber: string; // 사용자 전화번호
  id: number; // 사용자 고유 id
  createdAt: Date; // 사용자 회원가입 일자
  updatedAt: Date; // 사용자 정보 수정 일자
}

export abstract class CreateUserResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({
    description: 'response result',
    example: {
      email: 'testEmail@naver.com',
      name: 'testName',
      phoneNumber: '010-1111-1111',
      id: 1,
      createdAt: '2022-11-25T08:49:39.186Z',
      updatedAt: '2022-11-25T08:49:39.186Z',
    },
  })
  user: CreateUserResponseData;
}
