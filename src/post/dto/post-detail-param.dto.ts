import { ApiProperty } from '@nestjs/swagger';

export class PostDetailParamDto {
  // 우편 디테일 확인 요청에 사용하는 데이터 클래스
  @ApiProperty({ description: 'post detail request parameter', example: 1 })
  postId: number; // Detail을 확인하고자 하는 영상 우편의 고유 id
}
