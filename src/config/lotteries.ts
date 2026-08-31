export type BallTone = 'red' | 'blue'

export interface BallZoneConfig {
  id: string
  title: string
  ariaName: string
  slotPrefix: string
  tone: BallTone
  maxNumber: number
  required: number
}

export interface LotteryGameConfig {
  id: string
  name: string
  selectionLabel: string
  helper: string
  zones: BallZoneConfig[]
}

export const lotteryGames: LotteryGameConfig[] = [
  {
    id: 'double-color-ball',
    name: '双色球',
    selectionLabel: '6 + 1',
    helper: '红球 01–33 选 6 个，蓝球 01–16 选 1 个',
    zones: [
      {
        id: 'red',
        title: '红球',
        ariaName: '红球',
        slotPrefix: '红',
        tone: 'red',
        maxNumber: 33,
        required: 6,
      },
      {
        id: 'blue',
        title: '蓝球',
        ariaName: '蓝球',
        slotPrefix: '蓝',
        tone: 'blue',
        maxNumber: 16,
        required: 1,
      },
    ],
  },
  {
    id: 'super-lotto',
    name: '大乐透',
    selectionLabel: '5 + 2',
    helper: '前区 01–35 选 5 个，后区 01–12 选 2 个',
    zones: [
      {
        id: 'front',
        title: '前区',
        ariaName: '前区红球',
        slotPrefix: '前',
        tone: 'red',
        maxNumber: 35,
        required: 5,
      },
      {
        id: 'back',
        title: '后区',
        ariaName: '后区蓝球',
        slotPrefix: '后',
        tone: 'blue',
        maxNumber: 12,
        required: 2,
      },
    ],
  },
]

export function createNumberRange(max: number) {
  return Array.from({ length: max }, (_, index) => index + 1)
}

export function formatBallNumber(value: number) {
  return String(value).padStart(2, '0')
}
