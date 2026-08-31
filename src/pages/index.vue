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
