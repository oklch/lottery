<script setup lang="ts">
import type { BallZoneConfig, LotteryGameConfig } from '~/config/lotteries'
import { useLotterySelection } from '~/composables/useLotterySelection'
import { createNumberRange, formatBallNumber } from '~/config/lotteries'

const props = defineProps<{
  game: LotteryGameConfig
}>()

const {
  selectedByZone,
  selectedCount,
  requiredCount,
  isComplete,
  toggle,
  clear,
} = useLotterySelection(props.game)

const betCount = ref<number | string>(1)
const resultElement = ref<HTMLElement | null>(null)

interface ConfirmationResult {
  zones: Array<{
    id: string
    title: string
    tone: BallZoneConfig['tone']
    numbers: string[]
  }>
  notes: number
  amount: number
}

const confirmationResult = ref<ConfirmationResult | null>(null)

const normalizedBetCount = computed(() => {
  const parsed = Math.trunc(Number(betCount.value))
  if (!Number.isFinite(parsed))
    return 1
  return Math.min(Math.max(parsed, 1), 100)
})

const totalPrice = computed(() => normalizedBetCount.value * 2)

function remainingFor(zone: BallZoneConfig) {
  return Math.max(zone.required - selectedByZone[zone.id].length, 0)
}

function zoneIsFull(zone: BallZoneConfig) {
  return selectedByZone[zone.id].length >= zone.required
}

function handleToggle(zone: BallZoneConfig, value: number) {
  confirmationResult.value = null
  toggle(zone.id, value)
}

function removeFromSlot(zone: BallZoneConfig, slot: number) {
  const value = selectedByZone[zone.id][slot - 1]
  if (value) {
    confirmationResult.value = null
    toggle(zone.id, value)
  }
}

function normalizeBetCount() {
  betCount.value = normalizedBetCount.value
}

function handleBetInput() {
  betCount.value = normalizedBetCount.value
  confirmationResult.value = null
}

function handleClear() {
  clear()
  betCount.value = 1
  confirmationResult.value = null
}

function handleConfirm() {
  if (!isComplete.value)
    return

  normalizeBetCount()
  const notes = normalizedBetCount.value

  confirmationResult.value = {
    zones: props.game.zones.map(zone => ({
      id: zone.id,
      title: zone.title,
      tone: zone.tone,
      numbers: selectedByZone[zone.id].map(formatBallNumber),
    })),
    notes,
    amount: notes * 2,
  }

  clear()
  betCount.value = 1
  nextTick(() => resultElement.value?.scrollIntoView({ block: 'nearest' }))
}
</script>

<template>
  <div class="lottery-picker">
    <div class="rule-line">
      <p>{{ game.helper }}</p>
      <span>{{ selectedCount }} / {{ requiredCount }}</span>
    </div>

    <section class="selection-tray" aria-label="已选号码槽位">
      <div
        v-for="zone in game.zones"
        :key="zone.id"
        class="slot-group"
        :class="`slot-group--${zone.tone}`"
      >
        <span class="slot-group__label">{{ zone.title }}</span>
        <ol>
          <li v-for="slot in zone.required" :key="slot">
            <span class="slot-index">{{ zone.slotPrefix }}{{ slot }}</span>
            <button
              class="selection-slot"
              :class="[`selection-slot--${zone.tone}`, { 'is-filled': selectedByZone[zone.id][slot - 1] }]"
              type="button"
              :disabled="!selectedByZone[zone.id][slot - 1]"
              :aria-label="selectedByZone[zone.id][slot - 1] ? `取消${zone.title} ${formatBallNumber(selectedByZone[zone.id][slot - 1])}` : `${zone.title}空槽位`"
              @click="removeFromSlot(zone, slot)"
            >
              {{ selectedByZone[zone.id][slot - 1] ? formatBallNumber(selectedByZone[zone.id][slot - 1]) : '—' }}
            </button>
          </li>
        </ol>
      </div>
    </section>

    <div class="picker-layout">
      <section
        v-for="zone in game.zones"
        :key="zone.id"
        class="number-zone"
        :class="[`number-zone--${zone.tone}`, `number-zone--count-${zone.maxNumber}`]"
        :aria-labelledby="`${game.id}-${zone.id}-title`"
      >
        <div class="zone-heading">
          <div>
            <span class="zone-dot" aria-hidden="true" />
            <h2 :id="`${game.id}-${zone.id}-title`">
              {{ zone.title }}
            </h2>
          </div>
          <p v-if="remainingFor(zone) > 0">
            再选 <strong>{{ remainingFor(zone) }}</strong> 个
          </p>
          <p v-else class="is-complete">
            已选齐
          </p>
        </div>

        <div class="number-grid" role="group" :aria-label="`${zone.ariaName}号码`">
          <NumberBall
            v-for="number in createNumberRange(zone.maxNumber)"
            :key="number"
            :value="number"
            :tone="zone.tone"
            :zone-name="zone.ariaName"
            :selected="selectedByZone[zone.id].includes(number)"
            :at-limit="zoneIsFull(zone)"
            @toggle="handleToggle(zone, $event)"
          />
        </div>
      </section>
    </div>

    <section
      v-if="confirmationResult"
      ref="resultElement"
      class="confirmation-result"
      role="status"
      aria-live="polite"
    >
      <div class="confirmation-result__heading">
        <span class="confirmation-check" aria-hidden="true" />
        <strong>选号成功</strong>
      </div>
      <div class="confirmation-result__numbers">
        <p
          v-for="zone in confirmationResult.zones"
          :key="zone.id"
          :class="`confirmation-zone--${zone.tone}`"
        >
          <span><i aria-hidden="true" />{{ zone.title }}</span>
          <strong>{{ zone.numbers.join(' · ') }}</strong>
        </p>
      </div>
      <div class="confirmation-result__total">
        <span>{{ confirmationResult.notes }} 注</span>
        <i aria-hidden="true" />
        <strong>{{ confirmationResult.amount }} 元</strong>
      </div>
    </section>

    <div class="action-dock">
      <button
        class="clear-button"
        type="button"
        :disabled="selectedCount === 0"
        @click="handleClear"
      >
        清空
      </button>
      <div class="ticket-summary" aria-label="投注汇总">
        <span>共</span>
        <input
          v-model="betCount"
          class="bet-count-input"
          type="number"
          inputmode="numeric"
          min="1"
          max="100"
          step="1"
          aria-label="注数"
          @input="handleBetInput"
          @blur="normalizeBetCount"
        >
        <span>注</span>
        <i aria-hidden="true" />
        <strong>{{ totalPrice }}</strong>
        <span>元</span>
      </div>
      <button
        class="confirm-button"
        type="button"
        :disabled="!isComplete"
        @click="handleConfirm"
      >
        确认选号
      </button>
    </div>
  </div>
</template>
