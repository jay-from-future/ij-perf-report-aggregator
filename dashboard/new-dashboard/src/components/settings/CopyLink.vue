<template>
  <div
    v-if="!props.timerangeConfigurator.customRange.value"
    class="card flex justify-content-center"
  >
    <a
      title="Copy link to charts"
      class="info"
      @click="copyLink"
    >
      <VTooltip theme="info">
        <span>
          <CopyIcon />
        </span>
        <template #popper><span class="text-sm">Copy link to dashboard with current date timeline.</span></template>
      </VTooltip>
    </a>
  </div>
  <div
    v-show="isToastVisible"
    id="toast-default"
    class="flex items-center p-2 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
    role="alert"
  >
    <div class="text-sm font-normal">Copied</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { parseDuration, TimeRangeConfigurator } from "../../configurators/TimeRangeConfigurator"
import CopyIcon from "../common/CopyIcon.vue"
const props = defineProps<{
  timerangeConfigurator: TimeRangeConfigurator
}>()
async function copyLink() {
  let url = window.location.href
  const now = new Date()
  const ago = getDateAgoByDuration(props.timerangeConfigurator.value.value)
  const dayFrom = ago.getUTCDay() > 2 ? ago.getUTCDay() - 1 : ago.getUTCDay()
  const dayTo = now.getUTCDay() < 31 ? now.getUTCDay() + 1 : now.getUTCDay()
  const filter = `${ago.getFullYear()}-${ago.getUTCMonth() + 1}-${dayFrom}:${now.getFullYear()}-${now.getUTCMonth() + 1}-${dayTo}`
  url = url.replace(new RegExp("&?customRange=.+&?"), "")
  url = url.replace(new RegExp("&?timeRange=.+&?"), "")
  await navigator.clipboard.writeText(url + "&timeRange=custom&customRange=" + filter)
  isToastVisible.value = true
  setTimeout(() => {
    isToastVisible.value = false
  }, 1500)
}
const isToastVisible = ref(false)
function getDateAgoByDuration(s: string): Date {
  const result = parseDuration(s)
  let days = 0
  if (result.days != null) {
    days += result.days
  }
  if (result.months != null) {
    days += result.months * 31
  }
  if (result.weeks != null) {
    days += result.weeks * 7
  }
  if (result.years != null) {
    days += result.years * 365
  }
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
</script>
<style scoped></style>
