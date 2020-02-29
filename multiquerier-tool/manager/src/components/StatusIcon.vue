<template>
  <span>
      <i v-if="status == 'idle'">⬛</i>
      <i v-if="status == 'running'">⛔</i>
      <i v-if="status == 'ok'">✅</i>
  </span>
</template>
<script>
export default {
  name: 'StatusIcon',
  props: {
    status: String
  }
}
</script>