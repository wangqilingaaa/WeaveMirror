<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NAvatar, useMessage } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

function handleLogout() {
  appStore.logout()
  message.success('已退出织世镜，期待你的归来。')
  router.push({ name: 'Login' })
}

/** 角色类型 */
interface Character {
  id: number
  name: string
  title: string
  description: string
  tags: { label: string; type: 'romance' | 'sci-fi' | 'other' }[]
  stats: { label: string; value: string }[]
  avatarColor: string
}

/** 示例角色数据 */
const characters: Character[] = [
  {
    id: 1,
    name: '苏晚晴',
    title: '月下旅人',
    description: '她行走于月下的每个角落，收集被遗忘的故事。手中的古灯照亮的不只是道路，还有人心深处最隐秘的记忆。',
    tags: [
      { label: '恋爱', type: 'romance' },
      { label: '治愈', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '2.3k' },
      { label: '热度', value: '4.7k' }
    ],
    avatarColor: '#ff7eb3'
  },
  {
    id: 2,
    name: '时零',
    title: '时空观测者',
    description: '来自 2147 年的时空观测者。表面上沉默寡言，实则对每个时空分支的情感脉络了如指掌。',
    tags: [
      { label: '科幻', type: 'sci-fi' },
      { label: '悬疑', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '1.8k' },
      { label: '热度', value: '3.2k' }
    ],
    avatarColor: '#5ce0d8'
  },
  {
    id: 3,
    name: '陆北辰',
    title: '古籍修复师',
    description: '大学图书馆的古籍修复师。每当他修复一本旧书，书中的故事便会在他梦中重现。',
    tags: [
      { label: '日常', type: 'other' },
      { label: '奇幻', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '1.2k' },
      { label: '热度', value: '2.1k' }
    ],
    avatarColor: '#b48eff'
  },
  {
    id: 4,
    name: '白夜',
    title: '不眠的侦探',
    description: '只接夜间委托的私家侦探。他说夜晚的街道比白天诚实得多——至少影子不会说谎。',
    tags: [
      { label: '悬疑', type: 'other' },
      { label: '都市', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '3.1k' },
      { label: '热度', value: '5.6k' }
    ],
    avatarColor: '#a99ec2'
  },
  {
    id: 5,
    name: '林汐',
    title: '深海歌者',
    description: '在人鱼与人类之间摇摆的歌者。她的歌声每十年才出现一次，据说听见的人会想起前世的爱人。',
    tags: [
      { label: '恋爱', type: 'romance' },
      { label: '奇幻', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '4.5k' },
      { label: '热度', value: '8.2k' }
    ],
    avatarColor: '#ff7eb3'
  },
  {
    id: 6,
    name: '织梦者·零',
    title: 'AI 梦境编织师',
    description: '一个在虚拟世界中觉醒的 AI。她能进入人类的梦境，并在其中编织完整的平行人生。',
    tags: [
      { label: '科幻', type: 'sci-fi' },
      { label: '哲思', type: 'other' }
    ],
    stats: [
      { label: '对话', value: '5.7k' },
      { label: '热度', value: '9.1k' }
    ],
    avatarColor: '#5ce0d8'
  }
]

/** 根据标签类型获取对应的颜色 */
function getTagColor(type: string): string {
  switch (type) {
    case 'romance':
      return 'var(--color-tag-pink)'
    case 'sci-fi':
      return 'var(--color-tag-cyan)'
    default:
      return 'var(--color-text-muted)'
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 顶栏 -->
    <header class="top-bar">
      <div class="top-bar-left">
        <svg class="brand-logo" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
            fill="currentColor"
          />
        </svg>
        <span class="brand-text">织世镜</span>
      </div>

      <div class="top-bar-right">
        <span class="user-greeting">
          {{ appStore.currentUser?.username }}
        </span>
        <NButton text class="btn-logout" @click="handleLogout">
          退出
        </NButton>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="main-content">
      <div class="content-header">
        <h1 class="section-title">探索角色</h1>
        <p class="section-desc">选择一个角色，开启一段独特的对话旅程。</p>
      </div>

      <!-- 角色卡片网格 -->
      <div class="card-grid">
        <article
          v-for="character in characters"
          :key="character.id"
          class="character-card"
        >
          <!-- 头像 -->
          <div class="card-avatar">
            <NAvatar
              :style="{ backgroundColor: character.avatarColor }"
              :size="56"
              round
            >
              {{ character.name.charAt(0) }}
            </NAvatar>
          </div>

          <!-- 信息区 -->
          <div class="card-body">
            <h2 class="card-name">{{ character.name }}</h2>
            <p class="card-title">{{ character.title }}</p>
            <p class="card-desc">{{ character.description }}</p>

            <!-- 标签 -->
            <div class="card-tags">
              <span
                v-for="tag in character.tags"
                :key="tag.label"
                class="tag"
                :style="{ '--tag-color': getTagColor(tag.type) }"
              >
                {{ tag.label }}
              </span>
            </div>

            <!-- 统计数据 -->
            <div class="card-stats">
              <div
                v-for="stat in character.stats"
                :key="stat.label"
                class="stat-item"
              >
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </div>

          <!-- 操作 -->
          <div class="card-action">
            <NButton size="small" class="btn-chat" round>
              开始对话
            </NButton>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-deep);
}

/* ==================== 顶栏 ==================== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background-color: var(--color-bg-main);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 22px;
  height: 22px;
  color: var(--color-primary);
}

.brand-text {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--color-text-body);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-greeting {
  font-size: 14px;
  color: var(--color-text-desc);
}

.btn-logout {
  font-size: 13px;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-error) !important;
  }
}

/* ==================== 主体 ==================== */
.main-content {
  flex: 1;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 48px 32px 64px;
}

.content-header {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 4px;
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-body);
}

.section-desc {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-desc);
}

/* ==================== 角色卡片网格 ==================== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* ==================== 角色卡片 ==================== */
.character-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

.card-avatar {
  margin-bottom: 16px;
}

.card-name {
  margin: 0 0 2px;
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-body);
}

.card-title {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.card-desc {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-desc);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ==================== 标签 ==================== */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--tag-color, var(--color-text-muted));
  color: var(--tag-color, var(--color-text-muted));
}

/* ==================== 统计数据 ==================== */
.card-stats {
  display: flex;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-body);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ==================== 卡片操作 ==================== */
.card-action {
  margin-top: auto;
}

.btn-chat {
  width: 100%;
  font-size: 13px;
  border-color: var(--color-primary);
  color: var(--color-primary);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--color-primary);
    color: #07060b;
    box-shadow: 0 0 12px rgba(180, 142, 255, 0.2);
  }
}

/* ==================== 响应式 ==================== */
@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 32px 16px 48px;
  }

  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .character-card {
    min-width: 160px;
  }

  .top-bar {
    padding: 0 16px;
  }
}
</style>
