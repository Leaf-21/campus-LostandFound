<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImageOff } from 'lucide-vue-next'

const props = defineProps<{ images: string[] }>()

const active = ref(0)

watch(
  () => props.images,
  () => {
    active.value = 0
  }
)
</script>

<template>
  <div v-if="images.length" class="image-gallery">
    <el-image
      :src="images[active]"
      fit="cover"
      class="gallery-main"
      :preview-src-list="images"
      :initial-index="active"
      preview-teleported
      hide-on-click-modal
    />
    <div v-if="images.length > 1" class="gallery-thumbs">
      <button
        v-for="(img, i) in images"
        :key="i"
        type="button"
        class="gallery-thumb"
        :class="{ 'is-active': i === active }"
        :aria-label="`查看第 ${i + 1} 张图片`"
        @click="active = i"
      >
        <img :src="img" alt="缩略图" loading="lazy" />
      </button>
    </div>
  </div>
  <div v-else class="gallery-empty">
    <ImageOff :size="36" />
    <span>暂无图片</span>
  </div>
</template>

<style lang="scss" scoped>
.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gallery-main {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-bg);
  cursor: zoom-in;
}

.gallery-thumbs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.gallery-thumb {
  width: 84px;
  height: 62px;
  flex-shrink: 0;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-control);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.is-active {
    border-color: var(--color-primary);
  }
}

.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, var(--color-bg) 0%, #eef3ef 100%);
  color: var(--color-border-strong);
  font-size: 14px;
}
</style>
