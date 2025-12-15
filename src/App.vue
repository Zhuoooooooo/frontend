<template>
  <div class="app-layout">
    <aside :class="{ collapsed: isCollapsed }" class="sidebar">
      <div class="toggle-button" @click="toggleSidebar">☰</div>

      <nav class="menu">
        <router-link to="/sp-monitor" class="menu-item" active-class="active">
          <span class="icon">🕵️</span>
	  <span :class="{ 'hidden-text': isCollapsed }">SP Monitor</span></router-link>
        <router-link to="/tablesize" class="menu-item" active-class="active">
          <span class="icon">📁</span>
          <span :class="{ 'hidden-text': isCollapsed }">Table Size</span></router-link>
	<router-link to="/connection" class="menu-item" active-class="active">
	  <span class="icon">🌐</span>
	  <span :class="{ 'hidden-text': isCollapsed }">Connection</span></router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return { isCollapsed: false }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    }
  }
}
</script>

<style scoped>

.container {
  /*display: flex; */
  height: 100vh;
  /*width: 200%; */
}

.app-layout { 
  display: flex;
  height: 100vh;
  width: 90vw;
  padding: 0;
  box-sizing: border-box;
  margin-left: auto;
  margin-right: auto;
}

.sidebar {
  width: 200px;
  background: #2c3e50; 
  color: white;
  transition: width 0.3s;
  overflow: hidden;
  margin-left: 80px;
}

.sidebar.collapsed { width: 60px; }

.toggle-button { padding: 15px; background: #1a252f; text-align: center; cursor: pointer; }

.menu { display: flex; flex-direction: column; }

.menu-item { color: white; text-decoration: none; padding: 15px; white-space: nowrap;}

.menu-item.active {
  background: #007bff; 
}

.icon {
  /* 💡 為圖示提供固定寬度，讓文字對齊 */
  min-width: 30px; 
  text-align: center;
  font-size: 1.2em; /* 讓圖示大一點 */
}

.hidden-text {
  opacity: 0;
  width: 0;
  transition: opacity 0.3s, width 0.3s;
}

.main-content { 
  flex: 1; 
  padding: 15px;
  background: #f5f7fa; 
  overflow-y: auto; 
}
</style>

