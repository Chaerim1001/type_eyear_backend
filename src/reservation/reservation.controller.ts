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
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('reservation')
@ApiTags('Reservation API')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  async getTocken(@Req() req: Request) {
    console.log(req.user);
  }

  @Post('')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '예약 등록 API',
    description: '예약 등록 ',
  })
  @ApiCreatedResponse({ description: '예약 신청한다.', type: String })
  createReservation(
    @Body() createReservationDto: CreateReservationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log(req.user);
    const reservation = this.reservationService.createReservation(
      createReservationDto,
      req.user.id,
    );

    return res.status(HttpStatus.CREATED).json(reservation);
  }
}
