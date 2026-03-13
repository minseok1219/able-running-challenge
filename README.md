# ABLE RUNNING CHALLENGE MVP v1

Next.js + TypeScript + Tailwind CSS + Supabase(PostgreSQL) + Recharts + Vercel 기준으로 구성한 운영형 MVP입니다.

배포 주소

- [https://able-running-challenge.vercel.app](https://able-running-challenge.vercel.app)

## 1. 구현 계획 요약

1. Supabase에 스키마와 시드 데이터를 적용합니다.
2. Next.js App Router 앱에서 서버 전용 Supabase client를 사용합니다.
3. 참가자 가입/로그인과 관리자 로그인은 자체 계정 테이블 기반으로 처리합니다.
4. 기록 저장/수정 시 자동 판정 로직을 서버에서 실행합니다.
5. approved 기록만 대시보드, 차트, 리더보드, 관리자 집계에 반영합니다.

## 2. 프로젝트 폴더 구조

```text
app
  (public)
    page.tsx
    guide/page.tsx
    signup/page.tsx
    login/page.tsx
    leaderboard/page.tsx
  (participant)
    dashboard/page.tsx
    records/page.tsx
    records/new/page.tsx
    records/[id]/edit/page.tsx
  (admin)
    admin/login/page.tsx
    admin/participants/page.tsx
    admin/records/page.tsx
    admin/overview/page.tsx
components
  charts.tsx
  forms.tsx
  navigation.tsx
  ui.tsx
lib
  actions
  auth
  calculations
  supabase
  utils
  validators
supabase
  schema.sql
  seed.sql
types
  db.ts
```

## 3. Supabase SQL 스키마

스키마는 [schema.sql](/Users/leo/Documents/Playground/supabase/schema.sql)에 정리되어 있습니다.

## 4. 시드 데이터

시드는 [seed.sql](/Users/leo/Documents/Playground/supabase/seed.sql)에 정리되어 있습니다.

기본 계정

- 참가자: `runner123 / Runner1234!`
- 관리자: `cfable / able1234!`

참고

- 참가자 로그인은 `participant_code`가 아니라 `아이디(username)` 기준입니다.
- `participant_code`는 가입 완료 후 발급되는 운영용 식별값으로 유지됩니다.

## 5. 핵심 유틸 함수 설계

- [challenge.ts](/Users/leo/Documents/Playground/lib/calculations/challenge.ts): 자동 상태 판정, 대시보드 계산, 차트 집계
- [format.ts](/Users/leo/Documents/Playground/lib/utils/format.ts): 거리/페이스 변환, 날짜 포맷, 당일 수정 판정 보조
- [password.ts](/Users/leo/Documents/Playground/lib/auth/password.ts): `scrypt` 기반 비밀번호 해시/검증
- [session.ts](/Users/leo/Documents/Playground/lib/auth/session.ts): HMAC 서명 세션 쿠키 생성/검증

## 6. 페이지별 구현 코드

각 페이지는 `app` 하위 경로에 구현되어 있으며, 참가자와 관리자 영역은 서버 측 권한 확인 후 렌더링됩니다.

현재 운영 기준 핵심 기능

- 참가자 가입 시 `아이디(username)` 직접 입력
- 참가자 로그인 시 `아이디 + 비밀번호` 사용
- 가입 완료 후 `participant_code` 자동 발급
- 관리자에서 참가자 `비활성화/재활성화` 가능
- 비활성화된 참가자는 로그인 불가, 리더보드 제외

## 7. 권한 처리 방식

- 클라이언트 직접 DB 접근 없이 서버 전용 Supabase client만 사용합니다.
- 모든 보호 페이지는 서버에서 세션 쿠키를 검증합니다.
- 참가자는 본인 기록만 조회/수정하고, 관리자는 전체 데이터에 접근합니다.
- Supabase 테이블에는 RLS를 활성화하고, 앱은 서버에서 service role로 접근합니다.

## 8. 실행 방법

```bash
npm install
cp .env.example .env.local
```

`.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
ALLOW_LOCAL_CHALLENGE_TESTING=true
```

Supabase SQL editor에서 아래 순서로 실행합니다.

1. [schema.sql](/Users/leo/Documents/Playground/supabase/schema.sql)
2. [seed.sql](/Users/leo/Documents/Playground/supabase/seed.sql)
3. username 로그인 구조를 반영하려면 [20260313_add_participant_username.sql](/Users/leo/Documents/Playground/supabase/migrations/20260313_add_participant_username.sql)

그 다음 실행합니다.

```bash
npm run dev
```

Vercel 배포 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
ALLOW_LOCAL_CHALLENGE_TESTING=false
```

운영 체크 포인트

1. 참가자 가입에서 `아이디` 입력칸이 보여야 합니다.
2. 참가자 로그인은 `/login` 에서 `아이디 + 비밀번호`로 진행합니다.
3. 관리자 로그인은 `/admin/login` 에서 진행합니다.
4. 관리자 `참가자 목록`에서 참가자 비활성화/재활성화가 가능합니다.
5. approved 기록만 대시보드, 차트, 리더보드에 반영됩니다.

운영 절차 요약

1. 참가자 가입
2. participant_code 자동 발급 확인
3. 참가자 기록 입력
4. 관리자에서 이상 기록 검토
5. 필요 시 참가자 비활성화

## 9. 남은 개선 포인트

- `server-only`와 테스트 코드 추가
- 관리자 기록 필터와 페이지네이션 보강
- 배포 환경용 에러 로깅 정리
