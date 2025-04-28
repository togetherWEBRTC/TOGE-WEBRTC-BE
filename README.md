1. 도커데스크탑 로컬컴퓨터에 설치 필요 (도커 홈페이지에서 설치)
2. ⭐️ 루트 디렉토리에 .env 추가 ⭐️
3. 루트 디렉토리에서 터미널로 도커 이미지 설치 및 컨테이너 실행(.docker-compose.yml 에 정의)
   ```bash
   docker compose up -d
   ```
4. 현재 구동중인 컨테이너 확인
   ```bash
   #키고 끄는건 도커데스크탑 컨테이너에서 가능
   docker compose ps
   ```
5. 설치 및 서버실행
   ```bash
   npm install
   npm run dev
   ```
6. DB Tools
   ```bash
   localhost:5540/ # REDIS
   localhost:8081/ # PHPMYADMIN
   ```

<small>_The Pokémon images used for profiles in this repository are copyright assets of The Pokémon Company. These images are sourced from the [PokeAPI/sprites](https://github.com/PokeAPI/sprites) repository and are used for informational and non-commercial purposes only._</small>
