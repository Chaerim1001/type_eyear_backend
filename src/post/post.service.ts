import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Storage } from '@google-cloud/storage';
import { analyzeVideoTranscript } from '../stt/G_Function';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from 'src/user/entities/user.entity';
import { Keyword } from 'src/keywords/entities/keyword.entity';
import { NameWord } from 'src/keywords/entities/nameWord.entity';
import { KeywordsService } from 'src/keywords/keywords.service';

@Injectable()
export class PostService {
  constructor(
    private storage: Storage, // 클라우드 storage

    // 사용할 데이터베이스 테이블에 대한 의존성 주입 --> repository 정의
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
    @InjectRepository(NameWord)
    private nameWordRepository: Repository<NameWord>,

    private readonly keywordService: KeywordsService,
  ) {
    this.postRepository = postRepository;
    this.userRepository = userRepository;
    this.nameWordRepository = nameWordRepository;
    this.keywordRepository = keywordRepository;
    this.storage = new Storage({
      projectId: `${process.env.PROJECT_ID}`,
      keyFilename: `${process.env.KEYPATH}`,
    });
  }

  async sendPost(
    // 우편 전송을 처리하는 함수
    createpostDto: CreatePostDto,
    video: Express.Multer.File,
    userId: number,
  ): Promise<any> {
    const bucket = this.storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);
    const nowDate = Date.now();
    const filename = nowDate + '.mp4';
    const blob = bucket.file(`${nowDate}.mp4`);
    const blobStream = blob.createWriteStream();

    // 영상 우편을 전송하는 사용자와 연결된 병원과 환자 정보를 찾아온다.
    const user = await this.userRepository.find({
      where: {
        id: userId,
      },
      relations: {
        patient: true,
        hospital: true,
      },
    });

    // 사용자 고유 명사에 대한 단어를 찾는다
    const nameWords = await this.nameWordRepository
      .createQueryBuilder('nameWord')
      .select('nameWord.word')
      .leftJoin('nameWord.user', 'user')
      .where('user.id = :userId', { userId })
      .execute();

    // 사용자 영상의 추출 키워드 단어를 찾는다.
    const keywords = await this.keywordRepository
      .createQueryBuilder('keyword')
      .select('keyword.word')
      .leftJoin('keyword.user', 'user')
      .where('user.id = :userId', { userId })
      .execute();

    blobStream.on('error', (err) => {
      console.error(err);
    });

    // GCP API를 호출한다 --> 앞서서 찾은 keyword를 매개변수롤 사용한다
    blobStream.on('finish', async () => {
      analyzeVideoTranscript(
        `${filename}`,
        video.buffer,
        nameWords,
        keywords,
      ).then(async (result) => {
        await this.keywordService.extract(result, userId, user[0].patient.id);
      });

      // GCP API 호출 후 클라우드에 저장한 영상 및 자막 파일에 대한 값을 데이터베이스에 저장한다.
      const result = await this.postRepository
        .createQueryBuilder()
        .insert()
        .into(Post)
        .values({
          video: () =>
            `'https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${nowDate}.mp4'`,
          text: () =>
            `'https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${nowDate}.txt'`,
          check: () => `${0}`,
          stampNumber: () => `${createpostDto.stampNumber}`,
          cardNumber: () => `'${createpostDto.cardNumber}'`,
          hospital: () => `'${user[0].hospital.id}'`,
          user: () => `'${user[0].id}'`,
          patient: () => `'${user[0].patient.id}'`,
        })
        .execute();

      return result;
    });

    blobStream.end(video.buffer);
  }

  async getPostDetail(postId: number, userId: number) {
    // 영상 우편 상세 디테일을 처리하는 함수
    const post = await this.postRepository // 요청을 받은 post가 데이터베이스에 저장되어 있는지 찾는다.
      .createQueryBuilder('post')
      .where('post.id =:postId', { postId })
      .andWhere('post.userId =:userId', { userId })
      .execute();

    if (post.length === 0) {
      // 요청한 post에 정보가 없을 경우 에러를 발생시킨다.
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: ['not existed post'],
        error: 'Not Found',
      });
    } else if (post.length > 1) {
      // id값이 유효하지 않은 경우 에러를 발생시킨다.
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['유효하지 않은 우편 및 개인 정보입니다.'],
        error: 'Bad Request',
      });
    }

    const result = {
      id: post[0].post_id,
      video: post[0].post_video,
      text: post[0].post_text,
      check: post[0].post_check,
      stampNumber: post[0].post_stampNumber,
      cardNumber: post[0].post_cardNumber,
      createdAt: post[0].post_createdAt.toISOString().split('T')[0],
    };

    return result;
  }
}
