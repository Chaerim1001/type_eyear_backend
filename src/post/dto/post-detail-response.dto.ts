import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';
import { Post } from '../entities/post.entity';

// 우편 디테일 요청에 대한 응답에 사용하는 클래스
export abstract class PostDetailResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({
    description: 'response result',
    example: {
      id: 1,
      video: 'test_url',
      text: 'test_url',
      check: false,
      stampNumber: 1,
      cardNumber: 1,
      createdAt: '2022-11-26',
    },
  })
  post: Post;
}
