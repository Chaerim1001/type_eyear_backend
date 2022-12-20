import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginUserDto } from '../dto/login.user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // usernaem 키 이름 변경 email로 요청
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const authUserDto: LoginUserDto = {
      // 요청 데이터에서 email과 password를 가져온다.
      email: email,
      password: password,
    };

    const user = await this.authService.validateUser(authUserDto); // email과 password를 통해 가입이 되어있는 사용자인지 확인한다.
    if (!user) {
      // 가입된 사용자가 아닌 경우 에러를 발생시킨다.
      throw new UnauthorizedException();
    }
    return user;
  }
}
