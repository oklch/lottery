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

<style scoped>
.number-ball {
  position: relative;
  display: grid;
  width: 46px;
  height: 46px;
  padding: 0;
  place-items: center;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  touch-action: manipulation;
  font-size: 14px;
  font-weight: 740;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 220ms ease,
    scale 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.number-ball--red {
  color: var(--red);
}

.number-ball--blue {
  color: var(--blue);
}

@media (hover: hover) and (pointer: fine) {
  .number-ball--red:hover:not(.is-selected, .is-at-limit) {
    background: var(--red-soft);
    box-shadow: 0 0 0 3px rgba(216, 31, 42, 0.1);
  }

  .number-ball--blue:hover:not(.is-selected, .is-at-limit) {
    background: var(--blue-soft);
    box-shadow: 0 0 0 3px rgba(21, 95, 192, 0.1);
  }
}

.number-ball.is-selected {
  color: #fff;
  scale: 1.06;
  animation: ball-settle 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.number-ball--red.is-selected {
  border-color: var(--red);
  background: var(--red);
  box-shadow: 0 7px 15px rgba(216, 31, 42, 0.24);
}

.number-ball--blue.is-selected {
  border-color: var(--blue);
  background: var(--blue);
  box-shadow: 0 7px 15px rgba(21, 95, 192, 0.24);
}

.number-ball.is-at-limit {
  cursor: not-allowed;
  opacity: 0.4;
}

@keyframes ball-settle {
  0% {
    scale: 0.84;
    filter: blur(1px);
  }

  100% {
    scale: 1.06;
    filter: blur(0);
  }
}

@media (max-width: 640px) {
  .number-ball {
    width: min(100%, 42px);
    height: auto;
    aspect-ratio: 1;
    font-size: 13px;
  }
}
</style>
