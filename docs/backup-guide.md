# 백업 운영 가이드

ABLE RUNNING CHALLENGE 프로젝트는 무료 플랜 기준으로도 Supabase 데이터를 정기적으로 JSON export 백업할 수 있습니다.

## 백업 대상

- `branches`
- `challenge_types`
- `users`
- `records`
- `admin_actions`

모든 백업은 `/Users/leo/Documents/Playground/backups` 아래에 날짜별 폴더로 저장됩니다.

## 수동 백업

프로젝트 루트에서 실행합니다.

```bash
npm run backup:export
```

NAS로 주 1회 복사만 따로 실행하려면 아래 명령을 사용합니다.

```bash
npm run backup:nas-sync
```

실행 후 아래 형식의 폴더가 생성됩니다.

```text
backups/
  20260321-031500/
    branches.json
    challenge_types.json
    users.json
    records.json
    admin_actions.json
    manifest.json
  latest-manifest.json
  logs/
```

## 자동 백업 설정

macOS 기본 스케줄러인 `launchd` 기준입니다.

### 1. LaunchAgents 디렉터리 생성

```bash
mkdir -p ~/Library/LaunchAgents
```

### 2. 설정 파일 복사

```bash
cp /Users/leo/Documents/Playground/scripts/com.crossfitable.arc-backup.plist \
  ~/Library/LaunchAgents/com.crossfitable.arc-backup.plist
```

### 3. 기존 작업이 있으면 해제 후 다시 등록

```bash
launchctl unload ~/Library/LaunchAgents/com.crossfitable.arc-backup.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.crossfitable.arc-backup.plist
```

### 4. 등록 확인

```bash
launchctl list | grep com.crossfitable.arc-backup
```

## 현재 기본 스케줄

- 매일 오전 `03:15` (한국 시간 기준 맥북 로컬 시간)
- 로그인 시 한 번 즉시 실행

## NAS 주 1회 복사 설정

### 1. `.env.local`에 NAS 경로 추가

NAS가 맥에 마운트되는 경로를 넣습니다.

```bash
NAS_BACKUP_DIR=/Volumes/YourNASShare/arc-backups
```

예시

```bash
NAS_BACKUP_DIR=/Volumes/leo_NAS/arc-backups
```

### 2. 주간 동기화 LaunchAgent 등록

```bash
cp /Users/leo/Documents/Playground/scripts/com.crossfitable.arc-backup-nas-sync.plist \
  ~/Library/LaunchAgents/com.crossfitable.arc-backup-nas-sync.plist
```

```bash
launchctl unload ~/Library/LaunchAgents/com.crossfitable.arc-backup-nas-sync.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.crossfitable.arc-backup-nas-sync.plist
```

### 3. 등록 확인

```bash
launchctl list | grep com.crossfitable.arc-backup-nas-sync
```

### 4. 현재 기본 스케줄

- 매주 월요일 오후 `03:00` (한국 시간 기준 맥북 로컬 시간)
- NAS 공유 폴더가 `/Volumes/...` 에 마운트된 경우에만 복사 실행
- NAS가 마운트되지 않았으면 로컬 폴더를 잘못 만들지 않고 안전하게 건너뜁니다

## 운영 권장 방식

1. 매일 자동 백업 유지
2. 챌린지 시작 직전 수동 백업 1회 추가
3. 대량 수정 전 수동 백업 1회 추가
4. `backups/` 폴더를 NAS 또는 외부 저장소에 주 1회 복사
5. 월 1회는 NAS 폴더에서 실제 파일이 쌓이고 있는지 확인

## 주의사항

- `.env.local`에 Supabase URL과 service role key가 들어 있어야 실행됩니다.
- `.env.local`에 `NAS_BACKUP_DIR`가 없으면 NAS 복사는 자동으로 건너뜁니다.
- `/Volumes/...` 경로를 쓸 경우, NAS가 먼저 마운트되어 있어야 합니다.
- 백업 파일에는 참가자 정보가 포함되므로 접근 권한을 제한하는 것이 좋습니다.
- 이 스크립트는 무료 플랜에서도 동작하는 “데이터 export 백업” 방식입니다.
