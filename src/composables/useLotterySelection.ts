import type { LotteryGameConfig } from '~/config/lotteries'

export type ToggleResult = 'selected' | 'removed' | 'limit'

export function useLotterySelection(game: LotteryGameConfig) {
  const selectedByZone = reactive<Record<string, number[]>>(
    Object.fromEntries(game.zones.map(zone => [zone.id, []])),
  )
  const confirmed = ref(false)

  const isComplete = computed(() => game.zones.every(
    zone => selectedByZone[zone.id].length === zone.required,
  ))

  const selectedCount = computed(() => game.zones.reduce(
    (total, zone) => total + selectedByZone[zone.id].length,
    0,
  ))

  const requiredCount = computed(() => game.zones.reduce(
    (total, zone) => total + zone.required,
    0,
  ))

  function toggle(zoneId: string, value: number): ToggleResult {
    const zone = game.zones.find(item => item.id === zoneId)
    if (!zone)
      throw new Error(`Unknown lottery zone: ${zoneId}`)

    confirmed.value = false
    const values = selectedByZone[zoneId]
    const selectedIndex = values.indexOf(value)

    if (selectedIndex >= 0) {
      values.splice(selectedIndex, 1)
      return 'removed'
    }

    if (values.length >= zone.required)
      return 'limit'

    values.push(value)
    values.sort((a, b) => a - b)
    return 'selected'
  }

  function clear() {
    for (const zone of game.zones)
      selectedByZone[zone.id].splice(0)
    confirmed.value = false
  }

  function confirm() {
    if (!isComplete.value)
      return false
    confirmed.value = true
    return true
  }

  return {
    selectedByZone,
    selectedCount,
    requiredCount,
    isComplete,
    confirmed,
    toggle,
    clear,
    confirm,
  }
}
