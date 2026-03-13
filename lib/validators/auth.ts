export function validateSignupInput({
  username,
  name,
  phoneLast4,
  password,
  branchId,
  challengeTypeId
}: {
  username: string;
  name: string;
  phoneLast4: string;
  password: string;
  branchId: string;
  challengeTypeId: string;
}) {
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username.trim())) {
    throw new Error("아이디는 영문, 숫자, 밑줄만 사용해 4~20자로 입력해주세요.");
  }

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

export function validateParticipantLoginInput(username: string, password: string) {
  if (!username.trim()) {
    throw new Error("아이디를 입력해주세요.");
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
