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
const ticketLines = ref<TicketLine[]>([])
const resultElement = ref<HTMLElement | null>(null)
let nextTicketId = 1

interface TicketZone {
  id: string
  title: string
  tone: BallZoneConfig['tone']
  numbers: number[]
}

interface TicketLine {
  id: number
  zones: TicketZone[]
  notes: number | string
}

interface ConfirmedTicketLine {
  id: number
  zones: TicketZone[]
  notes: number
}

interface ConfirmationResult {
  lines: ConfirmedTicketLine[]
  notes: number
  amount: number
}

function normalizeNotesValue(value: number | string) {
  const parsed = Math.trunc(Number(value))
  if (!Number.isFinite(parsed))
    return 1
  return Math.min(Math.max(parsed, 1), 100)
}

function currentSelectionAlreadyAdded() {
  return ticketLines.value.some(line => line.zones.every(zone => (
    selectedByZone[zone.id].join(',') === zone.numbers.join(',')
  )))
}

const normalizedBetCount = computed(() => normalizeNotesValue(betCount.value))
const ticketNotes = computed(() => ticketLines.value.reduce(
  (total, line) => total + normalizeNotesValue(line.notes),
  0,
))
const totalNotes = computed(() => ticketNotes.value + (
  isComplete.value ? normalizedBetCount.value : 0
))
const totalPrice = computed(() => totalNotes.value * 2)
const summaryValueClass = computed(() => {
  const digitCount = Math.max(
    String(totalNotes.value).length,
    String(totalPrice.value).length,
  )
  if (digitCount >= 5)
    return 'is-compact'
  if (digitCount >= 4)
    return 'is-tight'
  return ''
})
const hasCurrentSelection = computed(() => selectedCount.value > 0)
const canClear = computed(() => hasCurrentSelection.value || ticketLines.value.length > 0)
const clearButtonLabel = computed(() => hasCurrentSelection.value ? '清空本组' : '清空全部')
const isDuplicateSelection = computed(() => isComplete.value && currentSelectionAlreadyAdded())
const actionDisabled = computed(() => isDuplicateSelection.value || (!isComplete.value && ticketLines.value.length === 0))
const actionLabel = computed(() => isComplete.value ? '加入票单' : '确认选号')

const confirmationResult = ref<ConfirmationResult | null>(null)
const duplicateNotice = ref('')

function remainingFor(zone: BallZoneConfig) {
  return Math.max(zone.required - selectedByZone[zone.id].length, 0)
}

function zoneIsFull(zone: BallZoneConfig) {
  return selectedByZone[zone.id].length >= zone.required
}

function handleToggle(zone: BallZoneConfig, value: number) {
  confirmationResult.value = null
  duplicateNotice.value = ''
  toggle(zone.id, value)
  if (isDuplicateSelection.value)
    duplicateNotice.value = '这组号码已经加入票单，请选择不同的号码。'
}

function removeFromSlot(zone: BallZoneConfig, slot: number) {
  const value = selectedByZone[zone.id][slot - 1]
  if (value) {
    confirmationResult.value = null
    duplicateNotice.value = ''
    toggle(zone.id, value)
  }
}

function normalizeBetCount() {
  betCount.value = normalizedBetCount.value
}

function handleBetInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement | null
  if (input && input.value !== '' && Number(input.value) > 100) {
    input.value = '100'
    betCount.value = 100
  }
  confirmationResult.value = null
}

function formatLineIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function createTicketLine(notes: number): TicketLine {
  return {
    id: nextTicketId++,
    zones: props.game.zones.map(zone => ({
      id: zone.id,
      title: zone.title,
      tone: zone.tone,
      numbers: [...selectedByZone[zone.id]],
    })),
    notes,
  }
}

function addCurrentTicket() {
  if (!isComplete.value)
    return

  normalizeBetCount()
  if (currentSelectionAlreadyAdded()) {
    duplicateNotice.value = '这组号码已经加入票单，请选择不同的号码。'
    return
  }

  ticketLines.value.push(createTicketLine(normalizedBetCount.value))
  clear()
  betCount.value = 1
  confirmationResult.value = null
  duplicateNotice.value = ''
}

function handleLineNotesInput(line: TicketLine, event: Event) {
  const input = event.currentTarget as HTMLInputElement | null
  if (input && input.value !== '' && Number(input.value) > 100) {
    input.value = '100'
    line.notes = 100
  }
  confirmationResult.value = null
}

function normalizeLineNotes(line: TicketLine) {
  line.notes = normalizeNotesValue(line.notes)
}

function removeTicket(id: number) {
  const index = ticketLines.value.findIndex(line => line.id === id)
  if (index >= 0) {
    ticketLines.value.splice(index, 1)
    confirmationResult.value = null
    duplicateNotice.value = ''
  }
}

function handleClear() {
  if (hasCurrentSelection.value) {
    clear()
  }
  else {
    ticketLines.value.splice(0)
  }
  betCount.value = 1
  confirmationResult.value = null
  duplicateNotice.value = ''
}

function handleConfirm() {
  if (ticketLines.value.length === 0)
    return

  const lines = ticketLines.value.map(line => ({
    id: line.id,
    zones: line.zones.map(zone => ({
      ...zone,
      numbers: [...zone.numbers],
    })),
    notes: normalizeNotesValue(line.notes),
  }))
  const notes = lines.reduce((total, line) => total + line.notes, 0)

  confirmationResult.value = {
    lines,
    notes,
    amount: notes * 2,
  }

  ticketLines.value.splice(0)
  clear()
  betCount.value = 1
  duplicateNotice.value = ''
  nextTick(() => resultElement.value?.scrollIntoView({ block: 'nearest' }))
}

function handleAction() {
  if (isComplete.value) {
    addCurrentTicket()
    return
  }
  handleConfirm()
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

    <p v-if="duplicateNotice" class="selection-notice" role="alert">
      {{ duplicateNotice }}
    </p>

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
      v-if="ticketLines.length"
      class="ticket-list"
      :aria-labelledby="`${game.id}-ticket-list-title`"
    >
      <div class="ticket-list__header">
        <div>
          <h2 :id="`${game.id}-ticket-list-title`">
            已加入号码
          </h2>
          <span>{{ ticketLines.length }} 组号码</span>
        </div>
        <strong>{{ ticketNotes }} 注 · {{ ticketNotes * 2 }} 元</strong>
      </div>
      <ol class="ticket-list__items">
        <li
          v-for="(line, index) in ticketLines"
          :key="line.id"
          class="ticket-line"
        >
          <span class="ticket-line__index">{{ formatLineIndex(index) }}</span>
          <div class="ticket-line__numbers">
            <p v-for="zone in line.zones" :key="zone.id">
              <span
                class="ticket-line__zone"
                :class="`ticket-line__zone--${zone.tone}`"
              >
                <i aria-hidden="true" />
                {{ zone.title }}
              </span>
              <strong>{{ zone.numbers.map(formatBallNumber).join(' · ') }}</strong>
            </p>
          </div>
          <label class="ticket-line__count">
            <span>本组</span>
            <input
              v-model="line.notes"
              class="bet-count-input ticket-line__count-input"
              type="number"
              inputmode="numeric"
              min="1"
              max="100"
              step="1"
              :aria-label="`第 ${index + 1} 组注数`"
              @input="handleLineNotesInput(line, $event)"
              @blur="normalizeLineNotes(line)"
            >
            <span>注</span>
          </label>
          <button
            class="ticket-line__remove"
            type="button"
            :aria-label="`移除第 ${index + 1} 组号码`"
            @click="removeTicket(line.id)"
          >
            移除
          </button>
        </li>
      </ol>
    </section>

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
        <ol class="confirmation-result__list">
          <li
            v-for="(line, index) in confirmationResult.lines"
            :key="line.id"
            class="confirmation-result__item"
          >
            <span class="confirmation-result__index">{{ formatLineIndex(index) }}</span>
            <div class="confirmation-result__line">
              <p
                v-for="zone in line.zones"
                :key="zone.id"
                :class="`confirmation-zone--${zone.tone}`"
              >
                <span><i aria-hidden="true" />{{ zone.title }}</span>
                <strong>{{ zone.numbers.map(formatBallNumber).join(' · ') }}</strong>
              </p>
            </div>
            <span class="confirmation-result__line-notes">{{ line.notes }} 注</span>
          </li>
        </ol>
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
        :disabled="!canClear"
        @click="handleClear"
      >
        {{ clearButtonLabel }}
      </button>
      <div class="ticket-summary" aria-label="投注汇总">
        <label class="ticket-summary__current">
          <span>本组</span>
          <input
            v-model="betCount"
            class="bet-count-input"
            type="number"
            inputmode="numeric"
            min="1"
            max="100"
            step="1"
            aria-label="当前号码注数"
            @input="handleBetInput($event)"
            @blur="normalizeBetCount"
          >
          <span>注</span>
        </label>
        <i class="ticket-summary__divider" aria-hidden="true" />
        <div class="ticket-summary__total">
          <span>共</span>
          <strong
            class="ticket-summary__notes"
            :class="summaryValueClass"
          >{{ totalNotes }}</strong>
          <span>注</span>
          <i class="ticket-summary__amount-divider" aria-hidden="true" />
          <strong
            class="ticket-summary__amount"
            :class="summaryValueClass"
          >{{ totalPrice }}</strong>
          <span>元</span>
        </div>
      </div>
      <button
        class="confirm-button"
        type="button"
        :disabled="actionDisabled"
        @click="handleAction"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
