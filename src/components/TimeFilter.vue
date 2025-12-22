<template>
  <div class="filter-box">
    <label>Time Interval</label>
    <div class="time-inputs">
      <input type="datetime-local" v-model="localStart" />
      <span>~</span>
      <input type="datetime-local" v-model="localEnd" />
    </div>
  </div>
</template>

<script>
const formatDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export default {
  name: 'TimeFilter',
  props: {
    modelValue: Object
  },
  emits: ['update:modelValue'],
  data() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 3);
    const defaultEndTime = formatDateTimeLocal(now);
    const defaultStartTime = formatDateTimeLocal(sevenDaysAgo);

    return {
      localStart: this.modelValue?.start_time || defaultStartTime,
      localEnd: this.modelValue?.end_time || defaultEndTime
    }
  },
  watch: {
    localStart() {
      this.emitChange()
    },
    localEnd() {
      this.emitChange()
    }
  },
  mounted() {
        this.emitChange(); 
  },
  methods: {
    emitChange() {
      this.$emit('update:modelValue', {
        start_time: this.localStart,
        end_time: this.localEnd
      })
    }
  }
}
</script>

<style scoped>
.filter-box {
  display: flex;
  flex-direction: column;
  font-size: 20px;
  font-weight: 600;
  text-align: left;
  margin-left: 50px;
  gap: 7px;
}
.time-inputs {
  display: flex;
  align-items: center;
  gap: 20px;
}
 
.time-inputs input {
  padding: 6px 10px; /* 上下 8px，左右 12px */
  font-size: 14px; 
  border-radius: 4px; 
  border: 1px solid #ccc;
  min-width: 220px; 
}    
</style>

