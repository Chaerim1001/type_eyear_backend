import { ReqUserDto } from 'src/user/dto/req-user.dto';

// Request 객체 global 재정의
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface User extends ReqUserDto {}
  }
}
