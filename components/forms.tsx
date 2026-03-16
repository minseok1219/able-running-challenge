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
  action
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4">
      <Input label="아이디" name="username" placeholder="예: runner123" required />
      <Input label="비밀번호" name="password" type="password" required />
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
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">입력 가이드</p>
        <ul className="mt-3 grid gap-2 text-sm text-slate-600">
          <li>거리는 km 단위로 입력합니다. 예: `5.2`</li>
          <li>평균 페이스는 `mm:ss` 형식입니다. 예: `5:30`</li>
          <li>저장 즉시 승인, 경고, 거절 상태가 자동 판정됩니다.</li>
        </ul>
      </div>
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
          label="거리(km)"
          name="distance_km"
          type="number"
          step="0.1"
          defaultValue={record ? formatDistanceNumber(record.distance_m) : undefined}
          placeholder="예: 5.2"
          required
        />
      </div>
      <Input
        label="평균 페이스(mm:ss)"
        name="pace"
        defaultValue={record ? formatPace(record.pace_sec_per_km) : undefined}
        placeholder="예: 5:30"
        required
      />
      <Textarea
        label="메모"
        name="note"
        defaultValue={record?.note}
        placeholder="선택 입력"
      />
      <div className="flex justify-end">
        <SubmitButton>{record ? "기록 수정" : "기록 저장"}</SubmitButton>
      </div>
    </form>
  );
}
