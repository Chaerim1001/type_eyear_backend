import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 요청을 보내는 사용자에 대한 데이터 클래스
export class ReqUserDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  email: string;
}
