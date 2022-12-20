import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/utils/swagger/base-response.dto';

// 보낸 영상 우편 리스트 요청에 대한 응답 데이터 클래스
class PostsResponseData {
  post_id: number; // 영상 우편 고유 id
  post_stampNumber: number; // 우편 인덱스
  post_cardNumeber: number; // 카드 인덱스
  post_createdAt: string; // 영상 전송 날짜
}

export abstract class PostsResponse extends BaseResponse {
  constructor() {
    super();
  }

  @ApiProperty({
    description: 'response result',
    example: [
      {
        post_id: 1,
        post_stampNumber: 1,
        post_cardNumeber: 1,
        post_createdAt: '2022-11-25',
      },
      {
        post_id: 2,
        post_stampNumber: 2,
        post_cardNumeber: 2,
        post_createdAt: '2022-11-25',
      },
    ],
  })
  posts: PostsResponseData[];
}
