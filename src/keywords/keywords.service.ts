import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './entities/keyword.entity';
import { spawn } from 'child_process';

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keyword) // Keyword 테이블 사용을 위해 의존성을 주입해준다.
    private keywordRepository: Repository<Keyword>, // keyword 데이터를 위한 repository
  ) {
    this.keywordRepository = keywordRepository;
  }

  CUT_RATIO = 0.3; // 추출한 단어의 최소 중요도 값
  UPDATE_RATIO = 0.95; // 시간 가중치

  async extract(text: string, userId: number, patientId: number) {
    // 영상 속 중요 키워드 추출을 위한 함수
    const result = [];

    const extractResult = spawn('python3', ['extract.py', text]); // python의 keybert 라이브러리를 사용하여 문장 속 중요 키워드를 추출한다.

    extractResult.stdout.on('data', (data) => {
      // 다른 언어(python)로 작성된 스크립트이기 떄문에 자식 프로세스를 생성하여 추출 완료된 데이터를 리턴을 받으면 그 값으로 아래의 코드를 수행하도록 한다.
      let keywords = data.toString('utf8'); // 단어를 utf8로 변형해준다.

      // 데이터 가공
      keywords = keywords.slice(1, -3);
      const regExp = /\(([^)]+)\)/;
      const keywordsArray = keywords.split(regExp);

      keywordsArray.forEach((value, index) => {
        if (index % 2 === 1) {
          const temp = value.split(', ');
          if (Number(temp[1]) > this.CUT_RATIO) {
            // 일정 비율 이하 키워드는 저장하지 않음
            result.push({
              word: temp[0].slice(1, -1),
              rank: Number(temp[1]),
            });
          }
        }
      });
    });

    extractResult.on('close', async (code) => {
      // 키워드 추출이 모두 끝났을 경우
      if (code === 0) {
        try {
          // 사용자의 이전 키워드를 찾는다.
          const preKeyword = await this.keywordRepository
            .createQueryBuilder('keyword')
            .select('keyword')
            .where('keyword.userId = :userId', { userId })
            .andWhere('keyword.patientId = :patientId', { patientId })
            .execute();

          if (preKeyword.length === 0) {
            // 첫번째 키워드일 때 = 사용자가 첫번째 영상 우편을 보낸 경우
            // 키워드의 시간 가중치 적용 및 비교 과정없이 추출한 첫번째 키워드를 곧바로 데이터베이스에 저장한다.
            for (let i = 0; i < result.length; i++) {
              await this.keywordRepository
                .createQueryBuilder()
                .insert()
                .into(Keyword)
                .values({
                  word: () => `'${result[i].word}'`,
                  rank: () => `'${result[i].rank}'`,
                  user: () => `'${userId}'`,
                  patient: () => `'${patientId}'`,
                })
                .execute();
            }
            return;
          } else {
            // 첫번째 영상이 아닌 경우, 이전에 저장해두었던 키워드를 불러와 시간 가중치를 곱하고 현재 추출한 키워드와 중요도를 비교하여 업데이트를 수행한다.
            //  시간 가중치 업데이트
            for (let i = 0; i < preKeyword.length; i++) {
              result.push({
                word: preKeyword[i].keyword_word,
                rank: preKeyword[i].keyword_rank * this.UPDATE_RATIO,
              });
            }

            for (let i = 0; i < preKeyword.length; i++) {
              await this.keywordRepository.delete({
                id: preKeyword[i].keyword_id,
              });
            }

            // 중요도 순으로 정렬한다.
            result.sort((a, b) => {
              return parseFloat(b.rank) - parseFloat(a.rank);
            });

            const updateResult = result.splice(0, 20);

            for (let i = 0; i < updateResult.length; i++) {
              // 시간 가중치 값이 적용된 키워드를 저장한다.
              await this.keywordRepository
                .createQueryBuilder()
                .insert()
                .into(Keyword)
                .values({
                  word: () => `'${updateResult[i].word}'`,
                  rank: () => `'${updateResult[i].rank}'`,
                  user: () => `'${userId}'`,
                  patient: () => `'${patientId}'`,
                })
                .execute();
            }
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log('프로세스 종료:', code);
      }
    });
  }

  isSingleCharacter(text: string) {
    // 단어의 받침 여부를 체크하는 함수
    const strGa = 44032;
    const strHih = 55203;

    const lastStrCode = text.charCodeAt(text.length - 1);

    if (lastStrCode < strGa || lastStrCode > strHih) {
      return false; // 한글이 아닐 경우 false 반환
    }
    return (lastStrCode - strGa) % 28 === 0;
  }

  addPostposition(text: string) {
    // 단어의 받침 여부에 따라 다른 조사를 붙여주는 함수
    const word1 = text + (this.isSingleCharacter(text) ? '' : '이');
    const word2 = text + (this.isSingleCharacter(text) ? '는' : '이는');
    const word3 = text + (this.isSingleCharacter(text) ? '가' : '이가');
    const word4 = text + (this.isSingleCharacter(text) ? '랑' : '이랑');
    const word5 = text + (this.isSingleCharacter(text) ? '의' : '이의');
    const word6 = text + (this.isSingleCharacter(text) ? '에' : '이에');
    const words = [word1, word2, word3, word4, word5, word6];
    return words;
  }
}
