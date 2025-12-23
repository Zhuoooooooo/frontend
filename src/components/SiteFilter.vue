<template>
  <div class="filter-box">
    <label class="filter-label">{{ label }}</label>

    <div class="custom-select" @click="toggleDropdown" ref="selectBox">
      <input
        type="text"
        :placeholder="placeholder || 'Server Name'"
        :value="selectedLabels"
        class="select-input"
        readonly 
        @focus="isOpen = true"
      />
      
      <input
        type="text"
        v-model="searchText"
        @input.stop="isOpen = true"
        class="search-overlay"
        :class="{ active: isOpen }"
        placeholder="搜尋選項..."
      />
      
      <span class="arrow">▾</span>

      <div v-if="isOpen" class="dropdown">
        <div
          v-for="item in filteredOptions"
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

        <div v-if="filteredOptions.length === 0" class="dropdown-empty">
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
    //  modelValue 必須接受 Array
    modelValue: {
        type: Array,
        default: () => []
    },
    options: Array,
    label: String,
    placeholder: String
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      isOpen: false,
      searchText: "" // 初始值為空，不再與 modelValue 綁定
    };
  },
  computed: {
    filteredOptions() {
      const q = this.searchText.toLowerCase();
      // 保持原有的過濾邏輯
      return this.options.filter((o) => o.label.toLowerCase().includes(q));
    },
    // 計算選定項目的 Label 顯示在輸入框中 (用於 display only)
    selectedLabels() {
      if (this.modelValue.length === 0) {
        return '';
      }
      return this.modelValue.map(item => item.label).join(', ');
    }
  },
  methods: {
    //  檢查選項是否已被選定
    isSelected(item) {
      return this.modelValue.some(selectedItem => selectedItem.value === item.value);
    },
    //  處理多選邏輯
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
      
      this.searchText = ''; // 清除搜尋文字
      
      this.$emit("update:modelValue", newValue);
      this.$emit("change", newValue);
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen;
      // 關閉時清除搜尋文字，保持輸入框顯示已選標籤
      if (!this.isOpen) {
          this.searchText = ''; 
      }
    },
    handleClickOutside(e) {
      if (!this.$refs.selectBox.contains(e.target)) {
        this.isOpen = false;
        this.searchText = ''; // 關閉時清空搜尋文字
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
  text-align: left;
  margin-left: 9px;

}


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
  /* 💡 修正 7: 讓顯示文字的輸入框不被點擊，只作為顯示 */
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

/* 💡 新增 8: 真正的搜尋輸入框 (用於多選) */
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

/* 下拉選單開啟時，顯示搜尋框，讓用戶可以輸入 */
.search-overlay.active {
    opacity: 1;
    pointer-events: auto;
    border: 1px solid #ccc; 
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

/* 💡 移除或調整 dropdown-search 樣式，因為我們改用 search-overlay */
/* .dropdown-search { ... } */


/* 選項 */
.dropdown-item {
  display: flex; /* 💡 修正 9: 使用 Flexbox 排列 Checkbox 和 Label */
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: #f0f7ff;
}

/* 💡 修正 10: 設置 Checkbox 間距 */
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
