<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, ImageOff, MapPin } from 'lucide-vue-next'
import type { Post } from '@/types'
import { POST_TYPE_SHORT } from '@/utils/constants'
import { formatDateTime } from '@/utils/format'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ post: Post }>()

const router = useRouter()
const imgFailed = ref(false)

function go() {
  router.push(`/posts/${props.post.id}`)
}
</script>

<template>
  <article
    class="post-card"
    role="link"
    tabindex="0"
    :aria-label="post.title"
    @click="go"
    @keydown.enter="go"
  >
    <div class="post-card__media">
      <img
        v-if="post.images.length && !imgFailed"
        :src="post.images[0]"
        :alt="post.title"
        loading="lazy"
        @error="imgFailed = true"
      />
      <div v-else class="post-card__placeholder">
        <ImageOff :size="30" />
        <span>暂无图片</span>
      </div>
      <span
        class="post-card__type"
        :class="post.postType === 'LOST' ? 'is-lost' : 'is-found'"
      >
        {{ POST_TYPE_SHORT[post.postType] }}
      </span>
    </div>

    <div class="post-card__body">
      <div class="post-card__head">
        <h3 class="post-card__title line-clamp-2">{{ post.title }}</h3>
        <StatusBadge
          class="post-card__badge"
          :status="post.status"
          variant="post"
          :post-type="post.postType"
        />
      </div>
      <p class="post-card__meta">
        <MapPin :size="14" class="post-card__meta-icon" />
        <span class="post-card__ellipsis">{{ post.location }}</span>
      </p>
      <p class="post-card__meta">
        <Calendar :size="14" class="post-card__meta-icon" />
        {{ formatDateTime(post.occurredAt, 'M月D日 HH:mm') }}
      </p>
      <div class="post-card__footer">
        <span class="post-card__publisher">{{ post.publisher.nickname }}</span>
        <span class="post-card__time">{{ formatDateTime(post.createdAt, 'MM-DD HH:mm') }}</span>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.post-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-border-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.post-card__media {
  position: relative;
  width: 100%;
  height: 190px;
  background: var(--color-bg);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .post-card:hover img {
    transform: scale(1.04);
  }
}

.post-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: var(--color-border-strong);
  font-size: 13px;
  background: linear-gradient(135deg, var(--color-bg) 0%, #eef3ef 100%);
}

.post-card__type {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);

  &.is-lost {
    background: var(--color-primary);
  }

  &.is-found {
    background: var(--color-accent);
  }
}

.post-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
  flex: 1;
}

.post-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.post-card__title {
  flex: 1;
  font-size: var(--fs-card-title);
  font-weight: 600;
  color: var(--color-text);
  min-height: 46px;
}

.post-card__badge {
  margin-top: 3px;
  flex-shrink: 0;
}

.post-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.post-card__meta-icon {
  flex-shrink: 0;
  color: var(--color-border-strong);
}

.post-card__ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.post-card__publisher {
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 640px) {
  .post-card__media {
    height: 168px;
  }
}
</style>
