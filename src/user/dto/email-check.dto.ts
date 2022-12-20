import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

// 이메일 중복 확인 요청에 대한 데이터 클래스
export class EmailCheckDto {
  @IsString()
  @IsEmail()
  @ApiProperty({ description: '이메일' })
  email: string;
}
