import { createRouter, createWebHistory } from 'vue-router'
import SpMonitor from '../views/SpMonitor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/sp-monitor',
    },
    {
      path: '/sp-monitor',
      name: 'sp-monitor',
      component: SpMonitor,
    },
    {
      path: '/s3_bucket',
      name: 's3_bucket',
      component: () => import('../views/S3_Bucket.vue'),
    },
    {
      path: '/tablesize',
      name: 'tablesize',
      component: () => import('../views/TableSize.vue'),
    },
  ],
})

export default router
