import { describe, expect, it } from 'vitest'
import { useLotterySelection } from '~/composables/useLotterySelection'
import { lotteryGames } from '~/config/lotteries'

describe('lottery selection rules', () => {
  it('completes a double-color-ball ticket at exactly 6 + 1', () => {
    const game = lotteryGames[0]
    const selection = useLotterySelection(game)

    for (const number of [3, 8, 16, 22, 29, 31])
      expect(selection.toggle('red', number)).toBe('selected')

    expect(selection.toggle('red', 33)).toBe('limit')
    expect(selection.toggle('blue', 7)).toBe('selected')
    expect(selection.isComplete.value).toBe(true)
    expect(selection.confirm()).toBe(true)
    expect(selection.confirmed.value).toBe(true)
  })

  it('completes a super-lotto ticket at exactly 5 + 2 and can clear it', () => {
    const game = lotteryGames[1]
    const selection = useLotterySelection(game)

    for (const number of [1, 9, 17, 25, 35])
      selection.toggle('front', number)
    for (const number of [4, 12])
      selection.toggle('back', number)

    expect(selection.isComplete.value).toBe(true)
    selection.clear()
    expect(selection.selectedCount.value).toBe(0)
    expect(selection.isComplete.value).toBe(false)
  })

  it('removes a chosen number before accepting a replacement', () => {
    const selection = useLotterySelection(lotteryGames[0])

    for (const number of [1, 2, 3, 4, 5, 6])
      selection.toggle('red', number)

    expect(selection.toggle('red', 3)).toBe('removed')
    expect(selection.toggle('red', 7)).toBe('selected')
    expect(selection.selectedByZone.red).toEqual([1, 2, 4, 5, 6, 7])
  })
})
