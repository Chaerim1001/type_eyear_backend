import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ReservationResponse } from './dto/reservation-response.dto';
import { ReservationListResponse } from './dto/reservation-list-response.dto';

@Controller('reservation') // 면회 예약 관련 요청을 처리하는 controller
@ApiTags('Reservation API')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('') // 'reservation' url로 들어온 Post 요청을 처리한다.
  @UseGuards(JwtAuthGuard) // jwt auth를 사용한다.
  @ApiOperation({
    summary: '예약 등록 API',
    description: '예약 등록 ',
  })
  @ApiCreatedResponse({
    description: '예약 신청한다.',
    type: ReservationResponse,
  })
  async createReservation(
    // 면회 신청 시 로직을 처리하는 함수
    @Body() createReservationDto: CreateReservationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const reservation = await this.reservationService.createReservation(
      createReservationDto,
      req.user.id,
    );
    const result = {
      message: 'success',
      reservation: reservation,
    };
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get('') // 'reservation'으로 들어온 Get 요청을 처리한다.
  @UseGuards(JwtAuthGuard) // jwt auth를 사용한다.
  @ApiOperation({
    summary: '예약 신청 내역 조회 API',
    description: '예약 신청 내역 조회',
  })
  @ApiOkResponse({
    type: ReservationListResponse,
  })
  // 신청한 면회 예약 리스트에 대한 요청을 처리한다.
  async getReservationList(@Req() req: Request, @Res() res: Response) {
    const reservations = await this.reservationService.getReservationList(
      req.user.id,
    );
    const result = {
      message: 'success',
      reservations: reservations,
    };
    return res.status(HttpStatus.OK).json(result);
  }
}
