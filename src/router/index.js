import { createRouter, createWebHistory } from 'vue-router'
import SpMonitor from '../views/SpMonitor.vue'
import Connection from '../views/Connection.vue'
import TableSize from '../views/TableSize.vue'

const routes = [
  { path: '/', redirect: '/sp-monitor' },
  { path: '/sp-monitor', name: 'sp-monitor', component: SpMonitor },
  { path: '/connection', name: 'connection', component: Connection },
  { path: '/tablesize', name: 'tablesize', component: TableSize }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

