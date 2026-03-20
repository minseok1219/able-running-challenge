import type { BadgeCategory, BadgeCode, ChallengeType } from "@/types/db";

type BadgeDefinition = {
  code: BadgeCode;
  category: BadgeCategory;
  triggerType: string;
  triggerValue?: number | string;
  getTitle: (challenge: Pick<ChallengeType, "target_distance_m">) => string;
  getDescription: (challenge: Pick<ChallengeType, "name" | "target_distance_m">) => string;
  messagePool: string[];
};

const BASE_BADGE_ORDER: BadgeCode[] = [
  "first_upload",
  "first_week_entry",
  "first_week_half",
  "distance_10km",
  "distance_25km",
  "record_3",
  "weekly_goal",
  "weekend_run",
  "record_5",
  "week_3_runs",
  "weekly_2_streak",
  "distance_50km",
  "quiet_accumulation",
  "steady_week",
  "weekly_4_streak",
  "distance_75km",
  "half_finish",
  "final_week_entry",
  "late_sprint",
  "final_week_goal",
  "finishers_mindset",
  "show_dont_tell",
  "distance_100km",
  "streak_7days",
  "challenge_finish"
];

export function getBadgeOrder(challenge: Pick<ChallengeType, "target_distance_m">) {
  if (challenge.target_distance_m >= 160000) {
    return BASE_BADGE_ORDER;
  }

  return BASE_BADGE_ORDER.filter((code) => code !== "distance_100km");
}

export const BADGE_DEFINITIONS: Record<BadgeCode, BadgeDefinition> = {
  first_upload: {
    code: "first_upload",
    category: "시작 배지",
    triggerType: "first_record",
    getTitle: () => "첫 기록 등록",
    getDescription: () => "첫 승인 기록을 남기면 열리는 시작 배지입니다.",
    messagePool: [
      "오늘부터 시작입니다. 작게 보여도 이게 제일 중요합니다.",
      "첫 걸음이 가장 귀찮고, 그래서 가장 가치 있습니다.",
      "시작한 사람만 완주할 수 있습니다. 일단 통과.",
      "이 기록 하나가 분위기를 바꿉니다.",
      "드디어 챌린지가 숫자가 되기 시작했습니다."
    ]
  },
  first_week_entry: {
    code: "first_week_entry",
    category: "시작 배지",
    triggerType: "first_week_record",
    getTitle: () => "첫 주 진입",
    getDescription: () => "첫 주차 안에 승인 기록을 남기면 열립니다.",
    messagePool: [
      "첫 주는 적응이 아니라 선언입니다.",
      "아직 초반입니다. 그래서 더 좋습니다.",
      "첫 주에 발을 들였으면 이미 흐름은 탔습니다.",
      "조용히 시작했는데 꽤 괜찮습니다.",
      "처음이 가장 어렵지, 그다음은 리듬입니다."
    ]
  },
  first_week_half: {
    code: "first_week_half",
    category: "시작 배지",
    triggerType: "first_week_half",
    triggerValue: 0.5,
    getTitle: () => "첫 주 기준 절반 돌파",
    getDescription: () => "첫 주 기준 거리의 절반을 채우면 열립니다.",
    messagePool: [
      "절반이면 애매해 보여도, 포기하지 않는 사람 쪽입니다.",
      "반은 왔고, 이제 핑계는 줄어듭니다.",
      "절반까지 왔으면 이번 주는 해볼 만합니다.",
      "딱 여기서 한 번 더 뛰는 사람이 달라집니다.",
      "지금 페이스면 충분히 그림이 나옵니다."
    ]
  },
  distance_10km: {
    code: "distance_10km",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    triggerValue: 10000,
    getTitle: () => "10KM 돌파",
    getDescription: () => "승인 누적 거리 10km를 채우면 열립니다.",
    messagePool: [
      "몸이 이제 챌린지인 줄 알아차리기 시작했습니다.",
      "러닝화가 드디어 본업에 들어갔습니다.",
      "10km면 아직 초반, 그런데 이미 꽤 잘하고 있습니다.",
      "가볍게 시작했는데 기록은 가볍지 않습니다.",
      "숫자는 10, 분위기는 이제 시작 이상입니다."
    ]
  },
  distance_25km: {
    code: "distance_25km",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    triggerValue: 25000,
    getTitle: () => "25KM 돌파",
    getDescription: () => "승인 누적 거리 25km를 채우면 열립니다.",
    messagePool: [
      "이쯤 되면 우연히 뛰는 단계는 지났습니다.",
      "제법 러너처럼 보이기 시작했습니다.",
      "25km면 말보다 행동이 앞서기 시작한 거리입니다.",
      "누적은 조용한데, 차이는 분명합니다.",
      "이 거리부터는 성실함이 보이기 시작합니다."
    ]
  },
  distance_50km: {
    code: "distance_50km",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    triggerValue: 50000,
    getTitle: () => "50KM 돌파",
    getDescription: () => "승인 누적 거리 50km를 채우면 열립니다.",
    messagePool: [
      "슬슬 포기하기엔 너무 멀리 와버렸습니다.",
      "절반쯤 오면 힘든 게 아니라 진짜가 됩니다.",
      "여기까지 왔으면 완주 쪽이 더 가깝습니다.",
      "다리는 묻고 있습니다. 아직 더 가냐고.",
      "이제는 러닝이 아니라 태도의 문제입니다."
    ]
  },
  distance_75km: {
    code: "distance_75km",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    triggerValue: 75000,
    getTitle: () => "75KM 돌파",
    getDescription: () => "승인 누적 거리 75km를 채우면 열립니다.",
    messagePool: [
      "완주가 멀어 보이던 시점은 이미 지났습니다.",
      "여기까지 온 사람은 끝을 봅니다.",
      "숫자보다 무서운 건 꾸준함이었습니다.",
      "이제는 멈추는 게 더 어색한 구간입니다.",
      "거의 다 왔습니다. 그래서 오히려 더 집중해야 합니다."
    ]
  },
  distance_100km: {
    code: "distance_100km",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    triggerValue: 100000,
    getTitle: () => "100KM 돌파",
    getDescription: () => "승인 누적 거리 100km를 채우면 열립니다.",
    messagePool: [
      "100km는 핑계보다 행동이 많았다는 뜻입니다.",
      "해냈습니다. 조용히, 하지만 확실하게.",
      "이 정도면 결과보다 과정이 더 멋있습니다.",
      "쉽게 만든 기록은 아닙니다. 그래서 더 좋습니다.",
      "에이블식으로 말하면, 잘한 겁니다. 많이."
    ]
  },
  challenge_finish: {
    code: "challenge_finish",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    getTitle: (challenge) =>
      challenge.target_distance_m >= 160000 ? "100 MILE 완주" : "100KM 돌파",
    getDescription: (challenge) =>
      challenge.target_distance_m >= 160000
        ? "승인 누적 거리 160km를 채우면 열리는 완주 배지입니다."
        : "승인 누적 거리 100km를 채우면 열리는 완주 배지입니다.",
    messagePool: [
      "이건 참여가 아니라 완주입니다.",
      "100마일은 체력이 아니라 태도로 끝냅니다.",
      "여기까지 온 사람은 설명이 필요 없습니다.",
      "멀리 가는 사람은 결국 꾸준한 사람입니다.",
      "이 기록은 숫자보다 서사에 가깝습니다."
    ]
  },
  weekly_goal: {
    code: "weekly_goal",
    category: "주차 미션 배지",
    triggerType: "weekly_target",
    getTitle: () => "이번 주 기준 달성",
    getDescription: () => "어느 한 주라도 주차 기준을 채우면 열립니다.",
    messagePool: [
      "이번 주 과제 제출 완료. 아주 깔끔합니다.",
      "주간 미션 완료. 러너의 체면은 지켰습니다.",
      "이번 주도 흐름을 놓치지 않았습니다.",
      "밀리지 않았다는 것만으로 이미 강합니다.",
      "오늘의 달성이 다음 주 여유를 만듭니다."
    ]
  },
  weekly_2_streak: {
    code: "weekly_2_streak",
    category: "주차 미션 배지",
    triggerType: "weekly_streak",
    triggerValue: 2,
    getTitle: () => "2주 연속 달성",
    getDescription: () => "주간 기준을 2주 연속 채우면 열립니다.",
    messagePool: [
      "이제는 의욕보다 리듬으로 가는 중입니다.",
      "두 주 연속이면 우연이 아닙니다.",
      "반복은 실력을 만들고, 실력은 완주를 만듭니다.",
      "꾸준함은 티가 늦게 나지만 결국 제일 셉니다.",
      "흐름이 붙기 시작했습니다."
    ]
  },
  weekly_4_streak: {
    code: "weekly_4_streak",
    category: "주차 미션 배지",
    triggerType: "weekly_streak",
    triggerValue: 4,
    getTitle: () => "4주 연속 달성",
    getDescription: () => "주간 기준을 4주 연속 채우면 열립니다.",
    messagePool: [
      "이 정도면 챌린지가 생활이 된 겁니다.",
      "강한 하루보다 꾸준한 4주가 더 어렵습니다.",
      "여기서부터는 진짜 완주권입니다.",
      "조용히 해내는 사람이 결국 멀리 갑니다.",
      "성실함이 누적되면 분위기가 달라집니다."
    ]
  },
  final_week_entry: {
    code: "final_week_entry",
    category: "주차 미션 배지",
    triggerType: "last_week_start",
    getTitle: () => "마지막 주 진입",
    getDescription: () => "챌린지 마지막 주가 시작되면 열립니다.",
    messagePool: [
      "마지막 주입니다. 이제는 정리보다 마무리입니다.",
      "여기까지 왔으면 끝을 봐야 합니다.",
      "마지막 주는 체력이 아니라 집중력입니다.",
      "끝이 보인다고 느슨해지면 안 됩니다.",
      "마지막 한 주가 전체 인상을 결정합니다."
    ]
  },
  final_week_goal: {
    code: "final_week_goal",
    category: "주차 미션 배지",
    triggerType: "last_week_target",
    getTitle: () => "마지막 주 기준 달성",
    getDescription: () => "마지막 주 기준 거리를 채우면 열립니다.",
    messagePool: [
      "마지막 주를 넘긴 사람은 완주를 설명하지 않습니다.",
      "끝까지 갔다는 건 늘 멋있습니다.",
      "마무리가 좋으면 전체가 달라집니다.",
      "완주는 마지막 주 태도에서 결정됩니다.",
      "여기까지 왔으면 충분히 잘했습니다."
    ]
  },
  record_3: {
    code: "record_3",
    category: "꾸준함 배지",
    triggerType: "record_count",
    triggerValue: 3,
    getTitle: () => "기록 3회 등록",
    getDescription: () => "승인 기록을 3회 남기면 열립니다.",
    messagePool: [
      "한 번은 시작, 세 번은 습관의 후보입니다.",
      "반복이 시작되면 완주도 현실이 됩니다.",
      "이쯤 되면 그냥 한 게 아닙니다.",
      "작지만 분명한 흐름이 생겼습니다.",
      "꾸준함은 늘 조용하게 시작됩니다."
    ]
  },
  record_5: {
    code: "record_5",
    category: "꾸준함 배지",
    triggerType: "record_count",
    triggerValue: 5,
    getTitle: () => "기록 5회 등록",
    getDescription: () => "승인 기록을 5회 남기면 열립니다.",
    messagePool: [
      "다섯 번이면 충분히 진심입니다.",
      "슬슬 나도 뛰는 사람이라고 해도 됩니다.",
      "횟수는 적어 보여도, 이런 게 분위기를 만듭니다.",
      "쌓이는 건 거리만이 아닙니다.",
      "리듬이 생겼다는 건 강한 신호입니다."
    ]
  },
  week_3_runs: {
    code: "week_3_runs",
    category: "꾸준함 배지",
    triggerType: "weekly_run_count",
    triggerValue: 3,
    getTitle: () => "한 주 3회 러닝",
    getDescription: () => "어느 한 주에 승인 기록 3회를 채우면 열립니다.",
    messagePool: [
      "한 번의 폭발보다 세 번의 성실함이 낫습니다.",
      "이번 주는 마음만 먹은 주가 아니었습니다.",
      "횟수는 곧 태도입니다.",
      "이번 주는 분명히 해낸 쪽입니다.",
      "꾸준한 주는 다음 주를 편하게 만듭니다."
    ]
  },
  weekend_run: {
    code: "weekend_run",
    category: "꾸준함 배지",
    triggerType: "weekend_record",
    getTitle: () => "주말 러닝 성공",
    getDescription: () => "토요일 또는 일요일에 승인 기록을 남기면 열립니다.",
    messagePool: [
      "쉬는 날에도 해낸 건 꽤 강한 의지입니다.",
      "주말에 뛰면 한 주의 분위기가 바뀝니다.",
      "이 기록은 성실함 쪽 점수입니다.",
      "주말을 쓰는 사람은 완주 확률이 높습니다.",
      "편한 날에도 움직였다는 게 중요합니다."
    ]
  },
  late_sprint: {
    code: "late_sprint",
    category: "꾸준함 배지",
    triggerType: "final_week_push",
    getTitle: () => "막판 스퍼트",
    getDescription: () => "챌린지 종료 7일 안에 강하게 거리 비중을 끌어올리면 열립니다.",
    messagePool: [
      "늦었다고 느낄 때 뛰는 사람이 결국 해냅니다.",
      "막판 집중력은 늘 생각보다 강합니다.",
      "끝부분에 강한 사람은 서사가 좋습니다.",
      "마지막에 분위기 뒤집는 것도 실력입니다.",
      "아직 안 끝났다는 걸 몸으로 보여줬습니다."
    ]
  },
  streak_7days: {
    code: "streak_7days",
    category: "꾸준함 배지",
    triggerType: "day_streak",
    triggerValue: 7,
    getTitle: () => "7일 연속 인증",
    getDescription: () => "승인 기록으로 7일 연속 흐름을 이어가면 열립니다.",
    messagePool: [
      "조용히 쌓였는데, 여기까지 오면 분위기가 다릅니다.",
      "일주일 내내 이어간 건 의지보다 리듬의 승리입니다.",
      "하루씩 이어 붙인 결과가 생각보다 큽니다.",
      "이 정도면 잠깐의 의욕이 아니라 습관에 가깝습니다.",
      "끊기지 않는 흐름은 늘 강합니다."
    ]
  },
  quiet_accumulation: {
    code: "quiet_accumulation",
    category: "에이블 스타일 배지",
    triggerType: "steady_accumulation",
    getTitle: () => "조용한 누적",
    getDescription: () => "큰 한 방 없이도 꾸준히 누적을 쌓으면 열립니다.",
    messagePool: [
      "조용히 쌓인 기록이 오래 갑니다.",
      "티 나지 않아도 강한 흐름이 있습니다.",
      "요란하지 않아도 충분히 좋습니다.",
      "에이블 스타일은 늘 조금 묵직합니다.",
      "말보다 숫자가 먼저 쌓이고 있습니다."
    ]
  },
  steady_week: {
    code: "steady_week",
    category: "에이블 스타일 배지",
    triggerType: "comfortable_weekly_target",
    getTitle: () => "흔들림 없는 주간 달성",
    getDescription: () => "주간 기준을 여유 있게 채우면 열립니다.",
    messagePool: [
      "무리 없이 해내는 것도 실력입니다.",
      "깔끔한 달성은 늘 보기 좋습니다.",
      "흔들리지 않는 페이스가 제일 무섭습니다.",
      "조절할 줄 아는 러닝은 오래 갑니다.",
      "이건 급한 완주가 아니라 안정적인 완주입니다."
    ]
  },
  finishers_mindset: {
    code: "finishers_mindset",
    category: "에이블 스타일 배지",
    triggerType: "final_week_consistency",
    getTitle: () => "끝까지 가는 사람",
    getDescription: () => "마지막 주까지 기록 흐름을 이어가면 열립니다.",
    messagePool: [
      "시작보다 중요한 건 끝까지 가는 태도입니다.",
      "마지막까지 남아 있는 사람이 결국 남깁니다.",
      "중간의 의욕보다 끝의 집중이 더 셉니다.",
      "에이블식 완주는 끝까지 무너지지 않는 겁니다.",
      "기록은 남고, 태도는 더 오래 남습니다."
    ]
  },
  show_dont_tell: {
    code: "show_dont_tell",
    category: "에이블 스타일 배지",
    triggerType: "stable_weekly_and_total",
    getTitle: () => "보여주기보다 해내기",
    getDescription: () => "누적과 주차 기준을 안정적으로 함께 채우면 열립니다.",
    messagePool: [
      "보여주기보다 해내는 쪽이 더 멋있습니다.",
      "과한 말 없이도 충분한 기록입니다.",
      "설명이 필요 없는 진행입니다.",
      "조용한 완주가 더 오래 기억됩니다.",
      "결국 남는 건 숫자보다 태도입니다."
    ]
  },
  half_finish: {
    code: "half_finish",
    category: "누적 거리 배지",
    triggerType: "distance_total",
    getTitle: () => "절반 달성",
    getDescription: (challenge) => `${challenge.name} 목표 거리의 절반을 채우면 열립니다.`,
    messagePool: [
      "절반까지 왔으면 이제 챌린지가 현실이 됩니다.",
      "반쯤 오면 고민보다 집중이 남습니다.",
      "여기까지 왔으면 완주 쪽이 훨씬 가까워졌습니다.",
      "중간 지점을 지나면 포기보다 마무리가 보입니다.",
      "절반은 숫자고, 여기까지 온 건 태도입니다."
    ]
  }
};

export function getBadgeDefinition(code: BadgeCode) {
  return BADGE_DEFINITIONS[code];
}

export function pickRandomBadgeMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)] ?? "";
}
