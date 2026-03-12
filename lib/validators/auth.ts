export function validateSignupInput({
  name,
  phoneLast4,
  password,
  branchId,
  challengeTypeId
}: {
  name: string;
  phoneLast4: string;
  password: string;
  branchId: string;
  challengeTypeId: string;
}) {
  if (name.trim().length < 2) {
    throw new Error("이름은 2자 이상 입력해주세요.");
  }

  if (!/^\d{4}$/.test(phoneLast4)) {
    throw new Error("연락처 뒤 4자리는 숫자 4자리로 입력해주세요.");
  }

  if (password.length < 8) {
    throw new Error("비밀번호는 8자 이상 입력해주세요.");
  }

  if (!branchId) {
    throw new Error("지점을 선택해주세요.");
  }

  if (!challengeTypeId) {
    throw new Error("챌린지 타입을 선택해주세요.");
  }
}

export function validateParticipantLoginInput(participantCode: string, password: string) {
  if (!participantCode.trim()) {
    throw new Error("참가자 코드를 입력해주세요.");
  }

  if (!password) {
    throw new Error("비밀번호를 입력해주세요.");
  }
}

export function validateAdminLoginInput(name: string, password: string) {
  if (!name.trim()) {
    throw new Error("관리자 이름을 입력해주세요.");
  }

  if (!password) {
    throw new Error("비밀번호를 입력해주세요.");
  }
}
