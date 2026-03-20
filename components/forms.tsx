import type { Branch, ChallengeType, RecordRow } from "@/types/db";

import { Input, Select, SubmitButton, Textarea } from "@/components/ui";
import { shouldResetPreChallengeRecords } from "@/lib/calculations/challenge";
import { formatDistanceNumber, formatPace } from "@/lib/utils/format";

export function SignupForm({
  branches,
  challengeTypes,
  action
}: {
  branches: Branch[];
  challengeTypes: ChallengeType[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4">
      <Input label="아이디" name="username" placeholder="예: runner123" required />
      <Input label="이름" name="name" required />
      <Input label="연락처 뒤 4자리" name="phone_last4" inputMode="numeric" required />
      <Input label="비밀번호" name="password" type="password" required />
      <Select
        label="지점"
        name="branch_id"
        required
        options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
      />
      <Select
        label="챌린지 타입"
        name="challenge_type_id"
        required
        options={challengeTypes.map((challenge) => ({
          value: challenge.id,
          label: `${challenge.name} (${challenge.start_date} ~ ${challenge.end_date})`
        }))}
      />
      <SubmitButton>가입하기</SubmitButton>
    </form>
  );
}

export function ParticipantLoginForm({
  action,
  defaultUsername = ""
}: {
  action: (formData: FormData) => Promise<void>;
  defaultUsername?: string;
}) {
  return (
    <form action={action} className="grid gap-4">
      <Input
        label="아이디"
        name="username"
        placeholder="예: runner123"
        defaultValue={defaultUsername}
        required
      />
      <Input label="비밀번호" name="password" type="password" required />
      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          name="remember_username"
          value="on"
          defaultChecked={Boolean(defaultUsername)}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <span>아이디 기억하기</span>
      </label>
      <SubmitButton>로그인</SubmitButton>
    </form>
  );
}

export function AdminLoginForm({
  action
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4">
      <Input label="관리자 이름" name="name" required />
      <Input label="비밀번호" name="password" type="password" required />
      <SubmitButton>관리자 로그인</SubmitButton>
    </form>
  );
}

export function RecordForm({
  action,
  challenge,
  record
}: {
  action: (formData: FormData) => Promise<void>;
  challenge: Pick<ChallengeType, "start_date" | "end_date">;
  record?: RecordRow;
}) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="날짜"
            name="run_date"
            type="date"
            defaultValue={record?.run_date}
            min={shouldResetPreChallengeRecords(challenge) ? challenge.start_date : undefined}
            max={challenge.end_date}
            required
          />
          <Input
            label="거리 (km)"
            name="distance_km"
            type="number"
            step="0.1"
            defaultValue={record ? formatDistanceNumber(record.distance_m) : undefined}
            placeholder="예: 5.2"
            required
          />
        </div>
        <Input
          label="평균 페이스 (mm:ss)"
          name="pace"
          defaultValue={record ? formatPace(record.pace_sec_per_km) : undefined}
          placeholder="예: 5:30"
          required
        />
        <Textarea
          label="메모"
          name="note"
          defaultValue={record?.note}
          placeholder="예: 오늘은 잠실 석촌호수 2바퀴"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {record ? "수정 저장 후 상태가 다시 계산됩니다." : "저장 즉시 기록이 반영됩니다."}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            승인 기록만 누적 거리, 차트, 리더보드에 반영됩니다.
          </p>
        </div>
        <SubmitButton>{record ? "기록 수정" : "기록 저장"}</SubmitButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-orange-50/40 to-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Quick Guide</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">
            {record ? "기록을 수정하면 상태가 다시 판정됩니다." : "입력 후 바로 자동 판정됩니다."}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            거리와 페이스만 정확히 입력하면 시스템이 승인, 경고, 거절 상태를 자동으로 계산합니다.
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">입력 규칙</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <li>거리는 km 단위 입력 · 예: 5.2</li>
            <li>평균 페이스는 mm:ss 형식 · 예: 5:30</li>
            <li>기록 메모는 선택 입력입니다</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
