import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// Login 요청 데이터 클래스
export class LoginUserDto {
  @IsString() // string 타입인지 확인하고 string 타입이 아닐 경우 자동으로 400 에러를 전송한다.
  @ApiProperty({ description: '이메일' })
  email: string;

  @IsString()
  @ApiProperty({ description: '비밀번호' })
  password!: string;
}
