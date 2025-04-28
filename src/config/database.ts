import { Sequelize } from "sequelize-typescript"
import { AccountDAO } from "@/models/dao.accounts"
import dotenv from "dotenv"

dotenv.config()

const sequelize = new Sequelize({
   dialect: "mariadb",
   host: process.env.DB_HOST,
   port: parseInt(process.env.DB_PORT || "3306"),
   username: process.env.MYSQL_USER,
   password: process.env.MYSQL_PASSWORD,
   database: process.env.MYSQL_DATABASE,
   models: [AccountDAO],
   logging: console.log,
})

export default sequelize

/**
기존의 테이블이 존재하는 경우 
1. npx sequelize-cli migration:generate --name NAME 으로 마이그레이션 생성
2. npx sequelize-cli db:migrate 적용
3. npx sequelize-cli db:migrate:undo 롤백필요시
* allowNull: false, 인경우는 반드시 defaultValue 설정

sequelize db:migrate                        # Run pending migrations (대기 중인 마이그레이션 실행)                
sequelize db:migrate:schema:timestamps:add  # Update migration table to have timestamps (마이그레이션 테이블에 타임스탬프 추가)
sequelize db:migrate:status                # List the status of all migrations (모든 마이그레이션 상태 확인)
sequelize db:migrate:undo                  # Reverts a migration (마지막 마이그레이션 되돌리기)
sequelize db:migrate:undo:all              # Revert all migrations ran (모든 마이그레이션 되돌리기)
sequelize db:seed                          # Run specified seeder (지정된 시더 실행)
sequelize db:seed:undo                     # Deletes data from the database (시더가 삽입한 데이터 삭제)
sequelize db:seed:all                      # Run every seeder (모든 시더 실행)
sequelize db:seed:undo:all                 # Deletes data from the database (모든 시더 데이터 삭제)
sequelize db:create                        # Create database specified by configuration (설정된 데이터베이스 생성)
sequelize db:drop                          # Drop database specified by configuration (설정된 데이터베이스 삭제)
sequelize init                             # Initializes project (프로젝트 초기화)
sequelize init:config                      # Initializes configuration (설정 파일 초기화)
sequelize init:migrations                  # Initializes migrations (마이그레이션 초기화)
sequelize init:models                      # Initializes models (모델 초기화)
sequelize init:seeders                     # Initializes seeders (시더 초기화)
sequelize migration:generate               # Generates a new migration file (새 마이그레이션 파일 생성)
sequelize migration:create                 # Generates a new migration file (새 마이그레이션 파일 생성)
sequelize model:generate                   # Generates a model and its migration (모델과 마이그레이션 파일 생성)
sequelize model:create                     # Generates a model and its migration (모델과 마이그레이션 파일 생성)
sequelize seed:generate                    # Generates a new seed file (새 시더 파일 생성)
sequelize seed:create                      # Generates a new seed file (새 시더 파일 생성)

모델 생성 후 반영 User - user_id:integer,user_name:string
npx sequelize-cli model:generate --name User --attributes user_id:integer,user_name:string
npx sequelize-cli migration:generate --name 마이그레이션이름
npx sequelize-cli db:migrate:status 
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo --env development dev롤백

// 문자열 타입
STRING        // VARCHAR(255)
STRING(100)   // VARCHAR(100)
TEXT          // TEXT
CHAR          // CHAR
CHAR(10)      // CHAR(10)
CITEXT        // CITEXT (대소문자 구분 없는 텍스트)

// 숫자 타입
INTEGER       // INT
BIGINT        // BIGINT
FLOAT         // FLOAT
DOUBLE        // DOUBLE
DECIMAL       // DECIMAL
DECIMAL(10,2) // DECIMAL(10,2)
REAL          // REAL
TINYINT       // TINYINT
SMALLINT      // SMALLINT

// 날짜/시간 타입
DATE          // DATETIME
TIME          // TIME
NOW           // TIMESTAMP
DATEONLY      // DATE (시간 없음)

// 불리언
BOOLEAN       // TINYINT(1)

// 기타
JSON          // JSON
JSONB         // JSONB (PostgreSQL)
ARRAY         // ARRAY (PostgreSQL)
UUID          // UUID
UUIDV4        // UUID v4
ENUM          // ENUM
CIDR          // CIDR (네트워크 주소)
MACADDR       // MAC 주소
RANGE         // 범위 타입
GEOMETRY      // 공간 데이터
GEOGRAPHY     // 지리 데이터
BLOB          // 바이너리 데이터

----------------------------------
@Table({
  // 기본 설정
  tableName: "Accounts",     // 실제 테이블 이름 지정
  timestamps: true,          // createdAt, updatedAt 자동 생성
  paranoid: false,           // soft delete 사용 여부 (deletedAt 컬럼 추가)
  freezeTableName: true,     // 테이블 이름 자동 복수화 방지

  // 이름 규칙 설정
  underscored: false,        // camelCase를 snake_case로 자동 변환
  modelName: 'Account',      // 모델 이름 설정

  // 데이터베이스 설정
  engine: 'InnoDB',          // 스토리지 엔진 (MySQL/MariaDB)
  charset: 'utf8mb4',        // 문자 인코딩
  collate: 'utf8mb4_general_ci', // 정렬 규칙
  
  // 인덱스 설정
  indexes: [
    {
      name: 'email_index',
      unique: true,
      fields: ['email']
    }
  ],

  // 기타 설정
  version: true,             // 버전 관리 필드 추가
  comment: '사용자 계정 테이블', // 테이블 주석
})

@Column({
  // 기본 옵션
  type: DataType.STRING,          // 데이터 타입
  allowNull: false,               // NULL 허용 여부
  unique: true,                   // 유니크 제약조건
  primaryKey: true,               // 기본키 설정
  autoIncrement: true,            // 자동 증가
  defaultValue: 'default value',  // 기본값 설정
  
  // 필드 이름 관련
  field: 'custom_column_name',    // 실제 DB 컬럼명
  comment: '컬럼 설명',           // 컬럼 코멘트
  
  // 인덱스 관련
  index: true,                    // 인덱스 생성
  unique: 'uniqueIndex',          // 유니크 인덱스
  
  // 검증 규칙
  validate: {
    isEmail: true,               // 이메일 형식
    isUrl: true,                 // URL 형식
    isIP: true,                  // IP 주소 형식
    isIPv4: true,               // IPv4 형식
    isIPv6: true,               // IPv6 형식
    isAlpha: true,              // 알파벳만
    isAlphanumeric: true,       // 알파벳과 숫자만
    isNumeric: true,            // 숫자만
    isInt: true,                // 정수만
    isFloat: true,              // 실수만
    isDecimal: true,            // 십진수만
    isLowercase: true,          // 소문자만
    isUppercase: true,          // 대문자만
    notNull: true,              // NULL 아님
    notEmpty: true,             // 빈 문자열 아님
    len: [2, 10],              // 길이 범위
    max: 23,                    // 최대값
    min: 0,                     // 최소값
    equals: 'specific value',   // 특정 값과 일치
    contains: 'text',           // 특정 텍스트 포함
    notContains: 'text',        // 특정 텍스트 미포함
    isIn: [['A', 'B']],        // 목록에 포함
    notIn: [['C', 'D']],       // 목록에 미포함
    isDate: true,              // 날짜 형식
    isCreditCard: true,        // 신용카드 번호 형식
    isUUID: 4,                 // UUID 형식
    isJSON: true,              // JSON 형식
    matches: /regex/,          // 정규식 매치
    custom(value) {            // 커스텀 검증
      if (value === 'invalid') {
        throw new Error('Invalid value');
      }
    }
  }
})
 */
