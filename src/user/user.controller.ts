import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailCheckDto } from './dto/email-check.dto';
import { UserService } from './user.service';
import { EamilCheckResponse } from './dto/email-check-response.dto';
import { CreateUserResponse } from './dto/create-user-response.dto';
import { PostsResponse } from './dto/posts-response.dto';
import { ConnectPatientDto } from './dto/connect-patient.dto';
import { ConnectPatientResponse } from './dto/connect-patient-response.dto';
import { HospitalListResponse } from './dto/hospital-list-response.dto';
import { ConnectedPatientResponse } from './dto/connected-patient-response.dto';

@Controller('user')
// 'user' url로 들어오는 요청에 대한 처리를 담당하는 controller
@ApiTags('User API')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('') // 'user'로 들어온 Post 요청을 처리한다.
  @ApiOperation({
    summary: '유저 생성 API',
    description: '유저를 생성한다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'success',
    type: CreateUserResponse,
  })
  async createUser(@Body() requestDto: CreateUserDto, @Res() res: Response) {
    // 회원가입에 대한 처리
    const user = await this.userService.createUser(requestDto);
    const result = {
      message: 'success',
      user: user,
    };
    return res.status(HttpStatus.CREATED).send(result);
  }

  @Get('emailCheck') // 'user/emailCheck' url로 들어온 Get 요청을 처리한다.
  @ApiOperation({
    summary: '이메일 중복 확인 API',
    description: '이메일 중복 확인 (false: 사용 불가, true: 사용 가능)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: EamilCheckResponse,
  })
  async emailCheck(
    @Query() emailCheckDto: EmailCheckDto,
    @Res() res: Response,
  ) {
    // 이메일 중복 확인에 대한 처리
    const isValid = await this.userService.emailCheck(emailCheckDto);
    const result = {
      message: 'success',
      ...isValid,
    };
    return res.status(HttpStatus.OK).send(result);
  }

  @Get('posts') // 'user/posts' url로 들어온 Get 요청을 처리한다.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '개인 보낸 우편 리스트 API',
    description: '보낸 우편 리스트 확인',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: PostsResponse,
  })
  async getPosts(@Req() req: Request, @Res() res: Response) {
    // 사용자가 보낸 영상 우편 리스트에 대한 조회 처리
    const posts = await this.userService.getPosts(req.user.id);
    const result = {
      message: 'success',
      posts: posts,
    };
    return res.status(HttpStatus.OK).send(result);
  }

  @Post('patient') // 'user/patient' url로 들어온 Post 요청을 처리한다.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '수신인 등록 API',
    description: '개인 수신인 등록(환자 연결) API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: ConnectPatientResponse,
  })
  async connectPatient(
    @Req() req: Request,
    @Res() res: Response,
    @Body() requestDto: ConnectPatientDto,
  ) {
    // 사용자와 환자를 연결하는 요청에 대한 처리
    const patient = await this.userService.connectPatient(
      req.user.id,
      requestDto,
    );
    const result = {
      message: 'success',
      patient: patient,
    };
    return res.status(HttpStatus.OK).send(result);
  }

  @Get('hospitals') // 'user/hospitals' url로 들어온 Get 요청을 처리한다.
  @ApiOperation({
    summary: '아이어 등록 병원 리스트 API',
    description: '아이어에 등록된 병원 리스트를 조회하는 API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: HospitalListResponse,
  })
  async getHospitalList(@Res() res: Response) {
    // 아이어에 등록된 병원 리스트 조회에 대한 처리
    const hospitals = await this.userService.getHospitalList();
    const result = {
      message: 'success',
      hospitals: hospitals,
    };
    return res.status(HttpStatus.OK).send(result);
  }

  @Get('patient') // 'user/patient' url로 들어온 Get 요청을 처리한다.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '등록된 수신인 확인 API',
    description: '[개인] 자신과 연결되어 있는 환자의 정보를 확인할 수 있는 API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success',
    type: ConnectedPatientResponse,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '등록된 환자가 없는 경우',
  })
  async getPatient(@Req() req: Request, @Res() res: Response) {
    // 자신과 연결된 환자에 대해 조회 처리
    const data = await this.userService.getPatient(req.user.id);
    if (data) {
      const result = {
        message: 'success',
        result: data,
      };
      return res.status(HttpStatus.OK).send(result);
    } else {
      return res.status(HttpStatus.NO_CONTENT).send();
    }
  }
}
