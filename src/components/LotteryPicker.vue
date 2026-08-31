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

<style scoped>
.lottery-picker {
  padding: 0 34px 28px;
}

.rule-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-muted);
  font-size: 13px;
}

.rule-line p {
  margin: 0;
}

.rule-line span {
  min-width: 56px;
  color: var(--ink);
  font-weight: 720;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.selection-tray {
  display: flex;
  gap: 24px;
  align-items: stretch;
  margin: 22px 0 28px;
  padding: 16px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: #fbfcfd;
  box-shadow: inset 0 3px 10px rgba(30, 38, 49, 0.05);
}

.selection-notice {
  margin: -14px 0 18px;
  padding: 10px 12px;
  border: 1px solid #efc1c5;
  border-radius: 10px;
  color: var(--red);
  background: var(--red-soft);
  font-size: 12px;
  line-height: 1.45;
}

.slot-group {
  display: flex;
  gap: 14px;
  min-width: 0;
  align-items: center;
}

.slot-group:first-child {
  flex: 1;
}

.slot-group__label {
  color: var(--ink-muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.slot-group ol {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(6, minmax(48px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.slot-group:last-child ol {
  grid-template-columns: repeat(2, minmax(48px, 1fr));
}

.slot-group li {
  display: grid;
  gap: 5px;
  justify-items: center;
}

.slot-index {
  color: #7a828f;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.selection-slot {
  display: grid;
  width: 48px;
  height: 48px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: #8c949f;
  background: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
  transition: box-shadow 160ms ease, scale 160ms ease;
}

.selection-slot:disabled {
  cursor: default;
}

.selection-slot--red.is-filled {
  border-color: var(--red);
  color: #fff;
  background: var(--red);
  box-shadow: 0 5px 14px rgba(216, 31, 42, 0.22);
}

.selection-slot--blue.is-filled {
  border-color: var(--blue);
  color: #fff;
  background: var(--blue);
  box-shadow: 0 5px 14px rgba(21, 95, 192, 0.22);
}

.picker-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.62fr) minmax(290px, 0.82fr);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.number-zone {
  min-width: 0;
  padding: 24px 26px 28px;
  touch-action: manipulation;
}

.number-zone + .number-zone {
  border-left: 1px solid var(--line);
}

.zone-heading,
.zone-heading > div {
  display: flex;
  align-items: center;
}

.zone-heading {
  justify-content: space-between;
  margin-bottom: 20px;
}

.zone-heading > div {
  gap: 9px;
}

.zone-heading h2,
.zone-heading p {
  margin: 0;
}

.zone-heading h2 {
  font-size: 18px;
  letter-spacing: -0.02em;
}

.zone-heading p {
  color: var(--ink-muted);
  font-size: 13px;
}

.zone-heading p strong {
  color: var(--ink);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.zone-heading .is-complete {
  color: var(--success);
  font-weight: 720;
}

.zone-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.number-zone--red .zone-dot {
  background: var(--red);
}

.number-zone--blue .zone-dot {
  background: var(--blue);
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(44px, 1fr));
  gap: 13px 12px;
  justify-items: center;
}

.number-zone--blue .number-grid {
  grid-template-columns: repeat(4, minmax(44px, 1fr));
}

@media (hover: hover) and (pointer: fine) {
  .selection-slot.is-filled:hover {
    scale: 1.06;
  }
}

.action-dock {
  position: sticky;
  z-index: 8;
  bottom: 16px;
  display: grid;
  grid-template-columns: 190px minmax(180px, 1fr) 190px;
  gap: 14px;
  align-items: center;
  margin-top: 18px;
  padding: 13px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 32px rgba(28, 34, 43, 0.13);
  touch-action: manipulation;
}

.ticket-list {
  margin-top: 18px;
  padding: 16px 18px 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fbfcfd;
}

.ticket-list__header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.ticket-list__header > div {
  display: flex;
  gap: 10px;
  min-width: 0;
  align-items: baseline;
}

.ticket-list__header h2 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  letter-spacing: -0.02em;
}

.ticket-list__header span,
.ticket-list__header > strong {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ticket-list__header span {
  color: var(--ink-muted);
}

.ticket-list__header > strong {
  min-width: 0;
  max-width: 48%;
  overflow: hidden;
  color: var(--ink);
  font-weight: 720;
  text-overflow: ellipsis;
}

.ticket-list__items {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.ticket-line {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto auto;
  gap: 14px;
  min-width: 0;
  align-items: center;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
}

.ticket-line__index,
.confirmation-result__index {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--ink-muted);
  background: var(--surface-soft);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.ticket-line__numbers {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.ticket-line__numbers p {
  display: flex;
  gap: 10px;
  min-width: 0;
  align-items: center;
  margin: 0;
  font-size: 12px;
}

.ticket-line__zone {
  display: inline-flex;
  flex: 0 0 52px;
  gap: 6px;
  align-items: center;
  color: var(--ink-muted);
  white-space: nowrap;
}

.ticket-line__zone i {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
}

.ticket-line__zone--red i {
  background: var(--red);
}

.ticket-line__zone--blue i {
  background: var(--blue);
}

.ticket-line__numbers strong {
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-line__count {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--ink-muted);
  font-size: 12px;
  white-space: nowrap;
}

.ticket-line .ticket-line__count-input {
  width: 48px;
  height: 34px;
  flex: 0 0 48px;
  font-size: 16px;
}

.ticket-line__remove {
  padding: 7px 4px;
  border: 0;
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.ticket-line__remove:hover {
  color: var(--red);
}

.confirmation-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  margin-top: 18px;
  padding: 16px 18px;
  border: 1px solid #a9d3bf;
  border-radius: 12px;
  color: #174e36;
  background: #f3fbf7;
}

.confirmation-result__heading {
  display: flex;
  gap: 9px;
  align-items: center;
  white-space: nowrap;
}

.confirmation-check {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  background: var(--success);
}

.confirmation-check::after {
  width: 7px;
  height: 4px;
  border-bottom: 2px solid #fff;
  border-left: 2px solid #fff;
  content: '';
  rotate: -45deg;
}

.confirmation-result__numbers {
  min-width: 0;
}

.confirmation-result__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.confirmation-result__item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  min-width: 0;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid rgba(169, 211, 191, 0.7);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.confirmation-result__line {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.confirmation-result__line p {
  display: flex;
  gap: 9px;
  min-width: 0;
  align-items: center;
  margin: 0;
  font-size: 13px;
}

.confirmation-result__line p > span {
  display: inline-flex;
  flex: 0 0 52px;
  gap: 6px;
  align-items: center;
  color: #51615a;
  white-space: nowrap;
}

.confirmation-result__line p > span i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}

.confirmation-zone--red > span i {
  background: var(--red);
}

.confirmation-zone--blue > span i {
  background: var(--blue);
}

.confirmation-result__line strong {
  overflow: hidden;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.confirmation-result__line-notes {
  color: var(--ink);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.confirmation-result__total {
  display: flex;
  gap: 10px;
  align-items: center;
  white-space: nowrap;
}

.confirmation-result__total i {
  width: 1px;
  height: 18px;
  background: #a9c9ba;
}

.clear-button,
.confirm-button {
  min-height: 52px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 720;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    translate 160ms ease,
    opacity 160ms ease;
}

.clear-button {
  border: 1px solid var(--line-strong);
  padding-inline: 2px;
  color: var(--ink);
  background: #fff;
  white-space: nowrap;
}

.clear-button:hover:not(:disabled) {
  border-color: #9ea7b3;
  background: var(--surface-soft);
}

.confirm-button {
  border: 1px solid var(--red);
  color: #fff;
  background: var(--red);
  box-shadow: 0 8px 18px rgba(216, 31, 42, 0.2);
}

.confirm-button:hover:not(:disabled) {
  background: #bd1722;
  translate: 0 -1px;
}

.clear-button:disabled,
.confirm-button:disabled {
  border-color: #d6dae0;
  color: #8b929d;
  background: #eef0f3;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
}

.ticket-summary {
  display: flex;
  gap: 14px;
  min-width: 0;
  width: 100%;
  align-items: center;
  justify-content: center;
  color: var(--ink-muted);
  font-size: 13px;
  white-space: nowrap;
}

.ticket-summary__current,
.ticket-summary__total {
  display: flex;
  gap: 4px;
  flex: 0 0 auto;
  align-items: center;
  white-space: nowrap;
}

.ticket-summary__current > span,
.ticket-summary__total > span,
.ticket-summary__total > strong {
  display: grid;
  flex: 0 0 auto;
  height: 38px;
  place-items: center;
  line-height: 1;
}

.bet-count-input {
  appearance: textfield;
  width: 56px;
  height: 38px;
  padding: 0 5px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--ink);
  background: #fff;
  font-size: 19px;
  font-weight: 740;
  font-variant-numeric: tabular-nums;
  text-align: center;
  flex: 0 0 56px;
}

.bet-count-input::-webkit-inner-spin-button,
.bet-count-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.bet-count-input:hover {
  border-color: #9ea7b3;
}

.ticket-summary__total > strong {
  width: 58px;
  flex-basis: 58px;
  overflow: hidden;
  color: var(--ink);
  font-size: 23px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-summary__divider,
.ticket-summary__amount-divider {
  flex: 0 0 1px;
  width: 1px;
  background: var(--line-strong);
}

.ticket-summary__divider {
  height: 20px;
}

.ticket-summary__amount-divider {
  height: 18px;
  margin: 0 4px;
}

.ticket-summary__amount {
  width: 60px;
  flex-basis: 60px;
  color: var(--ink);
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}

.ticket-summary__total > strong.is-tight {
  font-size: 20px;
  letter-spacing: -0.03em;
}

.ticket-summary__total > strong.is-compact {
  font-size: 17px;
  letter-spacing: -0.035em;
}

@media (max-width: 920px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .number-zone + .number-zone {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .number-zone--blue .number-grid {
    grid-template-columns: repeat(8, minmax(44px, 1fr));
  }

  .selection-tray {
    align-items: flex-end;
  }

  .slot-group {
    display: block;
  }

  .slot-group__label {
    display: block;
    margin-bottom: 7px;
  }

  .action-dock {
    grid-template-columns: min(190px, 24vw) minmax(180px, 1fr) min(190px, 24vw);
  }
}

@media (max-width: 640px) {
  .lottery-picker {
    padding: 0 16px 18px;
  }

  .rule-line {
    min-height: 48px;
    font-size: 12px;
  }

  .rule-line p {
    max-width: calc(100% - 58px);
  }

  .number-zone {
    margin: 0 -16px;
    padding: 22px 16px 25px;
  }

  .number-grid,
  .number-zone--blue .number-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px 6px;
  }

  .selection-tray {
    display: grid;
    gap: 14px;
    margin: 16px 0 20px;
    padding: 12px;
  }

  .slot-group:first-child {
    min-width: 0;
  }

  .slot-group ol {
    grid-template-columns: repeat(6, 40px);
    gap: 7px;
  }

  .slot-group:last-child ol {
    grid-template-columns: repeat(2, 40px);
  }

  .selection-slot {
    width: 40px;
    height: 40px;
    font-size: 13px;
  }

  .ticket-list {
    margin-top: 14px;
    padding: 13px 12px 14px;
  }

  .ticket-list__header {
    gap: 10px;
    align-items: flex-start;
  }

  .ticket-list__header > div {
    display: grid;
    gap: 3px;
    align-items: start;
  }

  .ticket-list__header h2 {
    font-size: 15px;
  }

  .ticket-list__header > strong {
    font-size: 11px;
  }

  .ticket-line {
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
    padding: 10px;
  }

  .ticket-line__index {
    width: 24px;
    height: 24px;
  }

  .ticket-line__numbers {
    padding-top: 3px;
  }

  .ticket-line__numbers p {
    gap: 6px;
    font-size: 11px;
  }

  .ticket-line__zone {
    flex-basis: 48px;
    gap: 5px;
  }

  .ticket-line__count {
    grid-column: 2 / -1;
    grid-row: 2;
    justify-self: end;
    margin-top: 2px;
    font-size: 11px;
  }

  .ticket-line__remove {
    grid-column: 3;
    grid-row: 1;
    padding: 4px 0;
  }

  .action-dock {
    bottom: 8px;
    grid-template-columns: 64px minmax(0, 1fr) 64px;
    gap: 6px;
    padding: 8px;
    border-radius: 13px;
  }

  .confirmation-result {
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 14px;
  }

  .confirmation-result__numbers {
    grid-column: 1 / -1;
    grid-row: 2;
    display: grid;
    gap: 8px;
  }

  .confirmation-result__item {
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 7px 8px;
  }

  .confirmation-result__index {
    width: 24px;
    height: 24px;
  }

  .confirmation-result__line p {
    gap: 6px;
    font-size: 12px;
  }

  .confirmation-result__line p > span {
    flex-basis: 48px;
  }

  .confirmation-result__line-notes {
    font-size: 11px;
  }

  .confirmation-result__total {
    grid-column: 2;
    grid-row: 1;
  }

  .clear-button,
  .confirm-button {
    min-height: 48px;
    font-size: 14px;
  }

  .ticket-summary {
    display: grid;
    gap: 4px;
    font-size: 11px;
    width: 100%;
  }

  .ticket-summary__current,
  .ticket-summary__total {
    gap: 2px;
    justify-content: center;
  }

  .ticket-summary__total > strong {
    width: 40px;
    flex-basis: 40px;
    font-size: 17px;
  }

  .ticket-summary__amount {
    width: 44px;
    flex-basis: 44px;
  }

  .ticket-summary__total > strong.is-tight {
    font-size: 15px;
  }

  .ticket-summary__total > strong.is-compact {
    font-size: 13px;
  }

  .bet-count-input {
    width: 48px;
    height: 34px;
    font-size: 16px;
    flex-basis: 48px;
  }

  .ticket-summary__current > span,
  .ticket-summary__total > span,
  .ticket-summary__total > strong {
    height: 34px;
  }

  .ticket-summary__divider {
    width: 100%;
    height: 1px;
  }

  .ticket-summary__amount-divider {
    margin: 0 3px;
  }
}

@media (max-width: 350px) {
  .number-grid,
  .number-zone--blue .number-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .action-dock {
    grid-template-columns: 64px minmax(0, 1fr) 64px;
    gap: 4px;
  }

  .ticket-summary {
    gap: 1px;
    width: 100%;
    font-size: 10px;
  }

  .ticket-summary__current,
  .ticket-summary__total {
    gap: 1px;
  }

  .ticket-summary__total > strong {
    width: 32px;
    flex-basis: 32px;
  }

  .ticket-summary__amount {
    width: 36px;
    flex-basis: 36px;
  }

  .ticket-summary__total > strong.is-tight {
    font-size: 14px;
  }

  .ticket-summary__total > strong.is-compact {
    font-size: 12px;
  }

  .ticket-summary__amount-divider {
    margin: 0 3px;
  }

  .bet-count-input {
    width: 48px;
    flex-basis: 48px;
  }
}
</style>
