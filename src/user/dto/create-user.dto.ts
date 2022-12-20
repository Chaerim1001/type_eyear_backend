import { ApiProperty } from '@nestjs/swagger';

// 사용자 회원가입 요청에 사용하는 데이터 클래스
export class CreateUserDto {
  @ApiProperty({ description: '이메일' })
  email: string; // 이메일

  @ApiProperty({ description: '비밀번호' })
  password!: string; // 비밀번호

  @ApiProperty({ description: '이름' })
  name: string; // 이름

  @ApiProperty({ description: '전화번호' })
  phoneNumber: string; // 전화번호
}
