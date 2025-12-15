<template>
  <div class="filter-box">
    <label class="filter-label">{{ label }}</label>

    <div class="custom-select" @click="toggleDropdown" ref="selectBox">
      <input
        type="text"
        :placeholder="placeholder || 'DB Name'"
        :value="isOpen ? searchText : selectedLabels"
        class="select-input"

        @click.stop="handleClickInput"

        @input="onSearchInput"
        @keydown.esc="closeDropdown"
        ref="searchInput"/>
      <span class="arrow">▾</span>

      <div v-if="isOpen" class="dropdown">
        <div
          v-for="item in options"
          :key="item.value"
          class="dropdown-item"
          @click.stop="selectOption(item)"
        >
          <input
            type="checkbox"
            :checked="isSelected(item)"
            @click.stop="selectOption(item)"
            :value="item.value"
          />
          {{ item.label }}
        </div>

        <div v-if="options && options.length === 0" class="dropdown-empty">
          no matching data
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SmartFilter",
  props: {
    modelValue: {
        type: Array,
        default: () => []
    },
    options: Array,
    label: String,
    placeholder: String
  },
  emits: ["update:modelValue", "change", "remote-query"],
  data() {
    return {
      isOpen: false,
      searchText: ""
    };
  },
  computed: {
    // 計算選定項目的 Label 顯示在輸入框中 (用於 display only)
    selectedLabels() {
      if (this.modelValue.length === 0) {
        return '';
      }
      return this.modelValue.map(item => item.label).join(', ');
    }
  },
  methods: {
    // 檢查選項是否已被選定
    isSelected(item) {
        return this.modelValue.some(selectedItem => selectedItem.value === item.value);
    },

    onSearchInput(event) {
      this.searchText = event.target.value;
      this.isOpen = true;             // 確保選單打開
      this.$emit('remote-query', this.searchText);
    },

    // 處理多選邏輯
    selectOption(item) {
      let newValue = [...this.modelValue];
      const index = newValue.findIndex(selectedItem => selectedItem.value === item.value);

      if (index > -1) {
        // 項目已存在 (取消勾選): 移除
        newValue.splice(index, 1);
      } else {
        // 項目不存在 (勾選): 新增
        newValue.push(item);
      }

      // 多選時不立即關閉選單，讓使用者可以繼續選擇
      // 且發送 remote-query='' 讓父組件重載完整列表
      this.$emit('remote-query', this.searchText);

      this.$emit("update:modelValue", newValue);
      this.$emit("change", newValue);
    },

    // 集中處理關閉選單邏輯
    closeDropdown() {
        this.isOpen = false;
        this.searchText = '';
     // this.$emit('remote-query', '');
    },

    // 處理點擊 input 框的行為
    handleClickInput() {
        // 當點擊 input 框時，如果選單是關閉的，則打開它並獲得焦點
        if (!this.isOpen) {
            this.toggleDropdown();
        }
        // 如果選單已經打開，則不做額外操作，讓 @input 事件處理
    },

    toggleDropdown() {
      this.isOpen = !this.isOpen;
     
      if (this.isOpen) {
        // 開啟時獲得焦點
         this.$nextTick(() => {
             this.$refs.searchInput.focus();
         });
      } else {
        // 關閉執行統一的關閉邏輯
         this.closeDropdown();
      }
    },

    handleClickOutside(e) {
      if (this.$refs.selectBox && !this.$refs.selectBox.contains(e.target)) {
        this.closeDropdown(); // closeDropdown 統一處理
      }
    }
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  }
};
</script>

<style scoped>
.filter-box {
  display: flex;
  width: 200px;
  flex-direction: column;
}

.filter-label {
  margin-bottom: 6px;
  font-size: 18px;
  font-weight: 600;
}

/* 外框 */
.custom-select {
  position: relative;
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 10px 10px 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  /* 讓顯示文字的輸入框不被點擊，只作為顯示 */
  pointer-events: none;
  background-color: white;
  /* 確保箭頭有空間 */
  padding-right: 30px;
}

.arrow {
  position: absolute;
  right: 12px; /* 調整箭頭位置 */
  top: 13px;
  pointer-events: none;
  font-size: 12px;
  color: #666;
  z-index: 3; /* 確保箭頭在搜尋框上方 */
}

/* 搜尋輸入框 (用於多選) */
.search-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    box-sizing: border-box;
    padding: 10px 30px 10px 12px;
    border-radius: 6px;
    font-size: 14px;
    /* 預設隱藏且不可交互 */
    opacity: 0;
    pointer-events: none;
    background: white;
    z-index: 2;
}


/* 下拉選單 */
.dropdown {
  position: absolute;
  z-index: 999;
  background: white;
  width: 100%;
  margin-top: 4px;
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}


/* 選項 */
.dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: #f0f7ff;
}

/* Checkbox 間距 */
.dropdown-item input[type="checkbox"] {
    margin-right: 8px;
    /* 確保點擊整個 item 時，邏輯只在 selectOption 中處理 */
    pointer-events: none;
}

/* 無資料 */
.dropdown-empty {
  padding: 10px;
  text-align: center;
  color: #999;
}
</style>

