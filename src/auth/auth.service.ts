import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login.user.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) // User 테이블을 사용하기 위해 repository에 의존성을 주입해준다.
    private userRepository: Repository<User>, // user 관련 데이터를 처리하기 위한 repository
    private jwtService: JwtService, // jwt 관련 연결을 위한 service
  ) {}

  // email과 password를 통해 가입된 사용자인지 확인하는 함수
  async validateUser(loginUserDto: LoginUserDto): Promise<any> {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      // email 검색으로 사용자가 나오지 않을 경우 등록되지 않았다는 에러를 전송한다.
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ['Unregistered user'],
        error: 'Forbidden',
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    // bcrypt를 사용하여 암호화되어 저장되어 있는 비밀번호와 요청에서 받아온 비밀번호를 비교한다.

    if (isMatch) {
      // 비밀번호 비교가 성공할 경우 성공된 user를 return한다.
      const { password, ...result } = user;
      return result;
    } else {
      // 비밀번호가 일치하지 않는 경우 에러를 발생시킨다.
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: ['Wrong password'],
        error: 'Forbidden',
      });
    }
  }

  async login(user: any) {
    // email과 password를 사용한 인증에 성공한 후 token을 만들어 전송해주는 함수
    const tokens = await this.getTokens(user.id, user.email);
    const data = {
      // jwt token과 user의 이름 정보를 프론트엔드에게 함께 전송한다.
      tokens: tokens,
      user: {
        name: user.name,
      },
    };
    await this.updateRtHash(user.id, tokens.refresh_token); // 데이터베이스에 저장한 refresh token 값을 업데이트해준다.
    return data;
  }

  async updateRtHash(userId: number, refresh_token: string) {
    // 데이터베이스에 저장한 refresh token 값을 업데이트해주는 함수
    const hash = await this.hashData(refresh_token);
    await this.userRepository.update(
      { id: userId },
      { currentHashedRefreshToken: hash },
    );
  }

  async refreshTokens(user: any) {
    // refresh token 갱신에 사용하는 함수
    const isExist = await this.userRepository.findOneBy({
      id: user.id,
    });
    // 요청을 보낸 user가 유효한 사용자인지 확인한다.
    if (!isExist || !isExist.currentHashedRefreshToken)
      throw new ForbiddenException('Invalid credentials');
    const rtMatches = bcrypt.compare(
      // 요청받은 refresh token이 DB에 저장된 값과 동일한지 확인한다.
      user.refresh_token,
      isExist.currentHashedRefreshToken,
    );
    if (!rtMatches) throw new ForbiddenException('Invalid credentials'); // 요청 데이터의 refresh token과 DB의 refresh token이 다른 경우 에러를 발생시킨다.

    // 일치하는 경우 새로운 access-token을 생성하여 전송한다.
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token); // DB의 refresh token을 새로 갱신한다.
    return tokens;
  }

  hashData(data: string) {
    // data를 받아 hash 값으로 변경한 뒤 return하는 함수
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: number, email: string) {
    // access token과 refresh token을 생성해주는 함수
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { id: userId, email },
        {
          expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        },
      ),
      this.jwtService.signAsync(
        { id: userId, email },
        {
          expiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
          secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        },
      ),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
