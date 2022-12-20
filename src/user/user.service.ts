import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Hospital } from 'src/hospital/entities/hospital.entity';
import { Patient } from 'src/hospital/entities/patient.entity';
import { NameWord } from 'src/keywords/entities/nameWord.entity';
import { KeywordsService } from 'src/keywords/keywords.service';
import { Post } from 'src/post/entities/post.entity';
import { Repository } from 'typeorm';
import { ConnectPatientDto } from './dto/connect-patient.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailCheckDto } from './dto/email-check.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  // User 처리를 위해 사용하는 테이블 의존성 주입 및 repository 생성
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(NameWord)
    private nameWordRepository: Repository<NameWord>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,

    private readonly keywordService: KeywordsService,
  ) {
    this.userRepository = userRepository;
    this.postRepository = postRepository;
    this.nameWordRepository = nameWordRepository;
    this.patientRepository = patientRepository;
    this.hospitalRepository = hospitalRepository;
  }

  async createUser(requestDto: CreateUserDto): Promise<any> {
    // 사용자 회원가입 처리 함수
    const isExist = await this.userRepository.findOneBy({
      email: requestDto.email,
    });

    if (isExist) {
      // 중복되는 이메일이 이미 존재할 경우 에러를 발생한다.
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ['Already registered email'],
        error: 'Forbidden',
      });
    }

    requestDto.password = await hash(requestDto.password, 10);

    const { password, ...result } = await this.userRepository.save(requestDto);

    const nameResult = await this.keywordService.addPostposition(result.name);

    for (const name of nameResult) {
      // 회원가입 시 입력된 사용자의 이름을 활용하여 고유 명사 키워드를 생성한다.
      await this.nameWordRepository
        .createQueryBuilder()
        .insert()
        .into(NameWord)
        .values({
          word: () => `'${name}'`,
          user: () => `'${result.id}'`,
        })
        .execute();
    }

    return result;
  }

  async emailCheck(emailCheckDto: EmailCheckDto) {
    // 이메일 중복 확인 처리 함수
    if (!emailCheckDto.email) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Invalid value'],
        error: 'Bad Request',
      });
    }

    const isExist = await this.userRepository.findOneBy({
      email: emailCheckDto.email,
    });

    const result = {};
    if (isExist) {
      result['isValidEmail'] = false;
    } else {
      result['isValidEmail'] = true;
    }
    return result;
  }

  async getPosts(userId: number) {
    // 사용자가 보낸 영상 우편 리스트 조회 함수
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .select('post.id')
      .addSelect('post.stampNumber')
      .addSelect('post.cardNumber')
      .addSelect('post.createdAt')
      .where('post.userId = :userId', { userId })
      .execute();

    for (const post of posts) {
      post.post_createdAt = post.post_createdAt.toISOString().split('T')[0];
    }

    return posts;
  }

  async connectPatient(userId: number, requestDto: ConnectPatientDto) {
    // 사용자와 환자를 연결하는 함수
    const { hospital_id, patient_infoNumber, patient_name } = requestDto;
    // 요청 데이터에 맞는 해당 환자를 찾는다.
    const patient = await this.patientRepository
      .createQueryBuilder('patient')
      .select('patient.id')
      .addSelect('patient.name')
      .addSelect('hospital.id')
      .leftJoin('patient.hospital', 'hospital')
      .where('hospital.id = :hospital_id', { hospital_id })
      .andWhere('patient.infoNumber LIKE :patient_infoNumber', {
        patient_infoNumber: `${patient_infoNumber}%`,
      })
      .andWhere('patient.name = :patient_name', {
        patient_name,
      })
      .execute();

    if (patient.length != 1) {
      // 요청 정보를 통해 조회되는 환자가 없거나 많을 경우 에러를 발생시킨다.
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['수신인 정보를 다시 확인해주세요.'],
        error: 'Bad Request',
      });
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .leftJoin('user.patient', 'patient')
      .where('patient.id = :patient_id', { patient_id: patient[0].patient_id })
      .execute();

    if (users.length > 0) {
      // 사용자의 정보를 조회하여 이미 연결이 완료된 환자인지 체크하고 이미 연결이 되어있으면 에러를 발생시킨다.
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['이미 연결이 완료된 환자입니다.'],
        error: 'Bad Request',
      });
    }

    try {
      // 사용자와 환자를 연결한다.
      await this.userRepository.update(
        { id: userId },
        {
          patient: patient[0].patient_id,
          hospital: patient[0].hospital_id,
        },
      );
    } catch (err) {
      console.log(err);
    }

    return patient[0];
  }

  async getHospitalList() {
    // 아이어 서비스에 등록된 병원 리스트를 반환한다.
    return await this.hospitalRepository.find({
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
      },
    });
  }

  async getPatient(userId: number) {
    // 자신과 연결된 환자의 정보를 반환하는 함수
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { patient: true, hospital: true },
    });

    if (user.patient) {
      const result = {
        user: { id: userId },
        patient: {
          id: user.patient.id,
          name: user.patient.name,
          number: user.patient.patNumber,
          inDate: user.patient.inDate.toISOString().split('T')[0],
          infoNumber: user.patient.infoNumber.substring(0, 8) + '******',
        },
        hospital: {
          id: user.hospital.id,
          name: user.hospital.name,
          address: user.hospital.address,
          phoneNumber: user.hospital.phoneNumber,
        },
      };
      return result;
    } else {
      return null;
    }
  }
}
