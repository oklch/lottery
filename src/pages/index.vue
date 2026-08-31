<script setup lang="ts">
import { Tab as VanTab, Tabs as VanTabs } from 'vant'
import { lotteryGames } from '~/config/lotteries'
import 'vant/es/tab/style'
import 'vant/es/tabs/style'

defineOptions({
  name: 'IndexPage',
})

const activeGame = ref(lotteryGames[0].id)
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="#main-picker" aria-label="回到选号区">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-dot brand-dot--red" />
          <span class="brand-dot brand-dot--blue" />
        </span>
        <span>
          <strong>数字彩选号</strong>
        </span>
      </a>
    </header>

    <section id="main-picker" class="picker-surface" aria-labelledby="picker-title">
      <div class="picker-heading">
        <div>
          <h1 id="picker-title">
            选择你的号码
          </h1>
          <p>每注 2 元，可加入多组号码后统一确认。</p>
        </div>
      </div>

      <VanTabs
        v-model:active="activeGame"
        class="game-tabs"
        swipeable
        animated
        :duration="0.28"
        line-width="32"
        line-height="3"
      >
        <VanTab
          v-for="game in lotteryGames"
          :key="game.id"
          :name="game.id"
        >
          <template #title>
            <span class="tab-title">
              <strong>{{ game.name }}</strong>
              <small>{{ game.selectionLabel }}</small>
            </span>
          </template>
          <LotteryPicker :game="game" />
        </VanTab>
      </VanTabs>
    </section>

  </div>
</template>

<style scoped>
.page-shell {
  width: min(100%, 1240px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 28px 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  margin-bottom: 18px;
}

.brand {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  position: relative;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 13px;
  background: var(--surface);
  box-shadow: 0 7px 18px rgba(28, 34, 43, 0.08);
}

.brand-dot {
  position: absolute;
  width: 17px;
  height: 17px;
  border: 3px solid #fff;
  border-radius: 50%;
}

.brand-dot--red {
  translate: -5px -4px;
  background: var(--red);
}

.brand-dot--blue {
  translate: 6px 6px;
  background: var(--blue);
}

.brand strong {
  display: block;
  font-size: 17px;
  letter-spacing: -0.02em;
}

.picker-surface {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(25, 32, 43, 0.09);
}

.picker-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 30px 34px 22px;
}

.picker-heading h1 {
  margin: 0;
  font-size: clamp(24px, 3vw, 38px);
  font-weight: 760;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.picker-heading p {
  margin: 8px 0 0;
  color: var(--ink-muted);
  font-size: 14px;
}

.game-tabs {
  --van-tabs-nav-background: #fff;
  --van-tabs-line-height: 62px;
  --van-tabs-bottom-bar-color: var(--red);
  --van-tab-active-text-color: var(--ink);
  --van-tab-text-color: #747c88;
  --van-padding-xs: 0;
}

.game-tabs :deep(.van-tabs__wrap) {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.game-tabs :deep(.van-tab) {
  flex: 1 0 0;
  min-width: 0;
  border-right: 1px solid var(--line);
}

.game-tabs :deep(.van-tab__text) {
  display: flex;
  min-width: 0;
  overflow: visible;
  align-items: center;
  justify-content: center;
}

.game-tabs :deep(.van-tab__text--ellipsis) {
  display: flex;
  overflow: visible;
  -webkit-box-orient: initial;
  -webkit-line-clamp: unset;
}

.game-tabs :deep(.van-tab:last-child) {
  border-right: 0;
}

.game-tabs :deep(.van-tabs__line) {
  border-radius: 3px 3px 0 0;
}

.tab-title {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  flex-shrink: 0;
  white-space: nowrap;
}

.tab-title strong {
  font-size: 16px;
  font-weight: 720;
}

.tab-title small {
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: #6a7280;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.game-tabs :deep(.van-tab--active) .tab-title small {
  color: var(--red);
  background: var(--red-soft);
}

@media (max-width: 920px) {
  .page-shell {
    padding: 18px;
  }
}

@media (max-width: 640px) {
  .page-shell {
    padding: 0 0 14px;
  }

  .topbar {
    min-height: 62px;
    margin: 0;
    padding: 9px 16px;
    background: #f4f6f8;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .brand strong {
    font-size: 15px;
  }

  .picker-surface {
    border-right: 0;
    border-left: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .picker-heading {
    display: block;
    padding: 22px 18px 18px;
  }

  .picker-heading h1 {
    font-size: 25px;
  }

  .picker-heading p {
    font-size: 13px;
  }

  .game-tabs {
    --van-tabs-line-height: 58px;
  }
}
</style>
