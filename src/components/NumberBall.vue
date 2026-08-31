<script setup lang="ts">
import type { BallTone } from '~/config/lotteries'
import { formatBallNumber } from '~/config/lotteries'

const props = defineProps<{
  value: number
  tone: BallTone
  zoneName: string
  selected: boolean
  atLimit: boolean
}>()

const emit = defineEmits<{
  toggle: [value: number]
}>()

const numberLabel = computed(() => formatBallNumber(props.value))
const stateLabel = computed(() => {
  if (props.selected)
    return '已选'
  if (props.atLimit)
    return '当前区域已选满'
  return '未选'
})
</script>

<template>
  <button
    class="number-ball"
    :class="[`number-ball--${tone}`, { 'is-selected': selected, 'is-at-limit': atLimit && !selected }]"
    type="button"
    :aria-label="`${zoneName} ${numberLabel}，${stateLabel}`"
    :aria-pressed="selected"
    :aria-disabled="atLimit && !selected"
    @click="emit('toggle', value)"
  >
    <span>{{ numberLabel }}</span>
  </button>
</template>
