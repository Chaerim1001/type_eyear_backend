// auth 관련 요청을 처리하는 controller file
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response.dto';
import { LoginUserDto } from './dto/login.user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
@ApiTags('Auth API')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard) // local auth 전략을 사용한다.
  @Post('login') // '/login'으로 들어온 Post 요청을 처리한다.
  @ApiBody({ type: LoginUserDto }) // API에 Body값의 type 지정
  @ApiOperation({
    // API에 대한 설명
    summary: '사용자 로그인 API',
    description: 'email과 password 정보를 통해 로그인을 진행한다',
  })
  @ApiResponse({
    // API의 성공 응답에 대한 설명
    status: HttpStatus.OK,
    description: 'success',
    type: LoginResponse,
  })
  async login(@Req() req: Request, @Res() res: Response) {
    const data = await this.authService.login(req.user); // request 데이터를 사용하여 service의 login함수를 호출한다.
    res.setHeader('Authorization', data.tokens.access_token); // 응답의 header에 access token을 설정해준다.

    return res
      .status(HttpStatus.OK)
      .send({ message: 'success', tokens: data.tokens, user: data.user });
  }

  @UseGuards(JwtRefreshAuthGuard) // refresh token 전략을 사용한다.
  @Get('/refresh') // '/refresh' 로 들어온 Get 요청을 처리한다.
  async getToken(@Req() req) {
    return await this.authService.refreshTokens(req.user); // 사용자의 refresh token을 사용해 새로운 access token을 생성하여 전달한다.
  }
}
