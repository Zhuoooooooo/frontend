<template>
  <div id="sp-monitor">
    <h1>SP Monitor System</h1>

    <div class="filters">
      <ServerFilter v-model="form.server" :options="serverList" label="Server" @change="onServerChange" />
      <DBFilter v-model="form.db" :options="dbList" label="DB" @change="onDBChange" @remote-query="onDBQuery" />
      <SpFilter v-model="form.sp_name" :options="spList" label="SP Name" @remote-query="onSPQuery"/>
      <div class="time-filter">
        <TimeFilter v-model="form.time_range" label="Time Interval" />
      </div>
      <button @click="resetPage(); fetchData()">查詢</button>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="!data.length">No data</div>

    <table v-if="data.length">
      <thead>
        <tr>
          <th>Server</th>
          <th>DB</th>
          <th>SP Name</th>
          <th>Exec_Count</th>
          <th>Exec_Second(Avg)</th>
          <th>Exec_Error</th>
          <th>NO_INDEX_USED</th>
          <th>NO_GOOD_INDEX_USED</th>
          <th>CreateTime</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item,i) in data" :key="i">
          <td>{{ item.Server }}</td>
          <td>{{ item.DB }}</td>
          <td>{{ item.SP_Name }}</td>
          <td>{{ item.Exec_Count }}</td>
          <td>{{ item.Exec_Second }}</td>
          <td>{{ item.Exec_Error }}</td>
          <td>{{ item.Exec_NO_INDEX_USED }}</td>
          <td>{{ item.Exec_NO_GOOD_INDEX_USED }}</td>
          <td>{{ item.CreateTime }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
           <td colspan="3"><strong>Total</strong></td>
           <td><strong>{{ totalExecCount }}</strong></td>
           <td><strong>{{ RoundToDecimal(totalExecSecond, 5) }}</strong></td>
           <td><strong>{{ totalExecError }}</strong></td>
           <td><strong>{{ totalNoIndexUsed }}</strong></td>
           <td><strong>{{ totalNoGoodIndexUsed }}</strong></td>
           <td></td>
        </tr>
      </tfoot>
    </table>
    <div v-if="pagination.last_page > 1" class="pagination-controls">
        <button @click="changePage(pagination.current_page - 1)"
                :disabled="pagination.current_page === 1">
            上一頁
        </button>

        <span>
            第 {{ pagination.current_page }} 頁 / 共 {{ pagination.last_page }} 頁 (總筆數: {{ pagination.total }})
        </span>

        <button @click="changePage(pagination.current_page + 1)"
                :disabled="pagination.current_page === pagination.last_page">
            下一頁
        </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import ServerFilter from '../components/ServerFilter.vue'
import DBFilter from '../components/DBFilter.vue'
import SpFilter from '../components/SpFilter.vue'
import TimeFilter from '../components/TimeFilter.vue'

export default {
  name: 'SpMonitor',
  components: { ServerFilter, DBFilter, SpFilter, TimeFilter },
  data() {
    return {
	    form: { server: [], db: [], sp_name: [], time_range: { start_time: '', end_time: ''}, db_query: '', sp_query: '' },
      serverList: [],
      dbList: [],
      spList: [],
      data: [],
      loading: false,
      error: '',
      totalExecCount: 0,
      totalExecSecond: 0,
      totalExecError: 0,
      totalNoIndexUsed: 0,
      totalNoGoodIndexUsed: 0,
      pagination: {
          current_page: 1,
          per_page: 30, // 應與後端預設值一致
          total: 0,
          last_page: 1
      },
    }
  },
  mounted() {
    this.fetchServerList()
  },
  methods: {
    async fetchServerList() {
      const res = await axios.get('/api/server_list')
      this.serverList = res.data.map(s => ({ label: s, value: s }))
    },
    async fetchDBList() {
      const server = this.form.server?.map(s => s.value).join(',') || ''
      const params = {}
      if (server) params.server = server
      if (this.form.db_query) params.q = this.form.db_query

      const res = await axios.get('/api/db_list', { params })
      this.dbList = res.data.map(d => ({ label: d, value: d }))
    },
    async fetchSPList() {
      const server = this.form.server?.map(s => s.value).join(',') || ''
      const db = this.form.db?.map(d => d.value).join(',') || ''
      const params = {}
      if (server) params.server = server
      if (db) params.db = db
      if (this.form.sp_query) params.q = this.form.sp_query

      const res = await axios.get('/api/sp_list', { params })
      this.spList = res.data.map(sp => ({ label: sp, value: sp }))
    },
    onServerChange() {
      this.form.db = []
      this.dbList = []
      this.form.sp_name = []
      this.spList = []
      this.fetchDBList()
      this.resetPage()
    },
    onDBChange() {
      this.form.sp_name = []
      this.spList = []
      this.fetchSPList()
      this.resetPage()
    },
    onDBQuery(query) {
	this.form.db_query = query;
	this.fetchDBList()
    },
    onSPQuery(query) {
	this.form.sp_query = query;
	this.fetchSPList()
    },
    resetPage() {
        this.pagination.current_page = 1
    },
    changePage(page) {
        if (page >= 1 && page <= this.pagination.last_page) {
            this.pagination.current_page = page
            this.fetchData()
        }
    },
    onTimeChange(newTimeRange) {
        this.resetPage()
    },
    async fetchData() {
      this.loading = true
      this.error = ''
      
      const params = {
        server: this.form.server?.map(s => s.value).join(',') || '',
        db: this.form.db?.map(s => s.value).join(',') || '',
        sp_name: this.form.sp_name?.map(s => s.value).join(',') || '',
        start_time: this.form.time_range.start_time,
        end_time: this.form.time_range.end_time,
	page: this.pagination.current_page,
	per_page: this.pagination.per_page
      }

      try {
          const res = await axios.get('api/sp_info', { params })
          this.data = res.data.data
	  this.pagination = { ...this.pagination, ...res.data.pagination }
      } catch (e) {
	  this.error = 'Failed: '+ e.message
	  this.data = []
      } finally {
	  this.loading = false
      }

      // reset totoal data
      this.totalExecCount = 0
      this.totalExecSecond = 0
      this.totalExecError = 0
      this.totalNoIndexUsed = 0
      this.totalNoGoodIndexUsed = 0
    
      this.data.forEach(item => {
          this.totalExecCount += item.Exec_Count || 0
          this.totalExecSecond += parseFloat(item.Exec_Second) || 0
          this.totalExecError += item.Exec_Error || 0
          this.totalNoIndexUsed += item.Exec_NO_INDEX_USED || 0
          this.totalNoGoodIndexUsed += item.Exec_NO_GOOD_INDEX_USED || 0
      })
    },
    RoundToDecimal(num, DecimalPlace) {
      const factor = Math.pow(10, DecimalPlace)
      return Math.round(num * factor) / factor
    }
  }
}
</script>


<style>
#sp-monitor {
  width: 100%;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  font-size: 45px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center; /* Horizontally centers */
  align-items: center; /* Vertically centers */
  text-align: center;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  flex-basis: 100%;
  gap: 30px;
  margin-bottom: 20px;
}

.time-filter {
  flex-basis: 100%;
  gap: 30px;
  grid-column: span 3;
  display: flex;
  align-items: center;
  
}

.filters button {
  grid-column: 4 / 5;
  padding: 4px 4px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  max-width: 100px; /* 限制最大寬度，避免過長 */
  width: auto; /* 自適應內容寬度 */
  transition: background-color 0.3s;
}

.filters button:hover {
  background-color: #0056b3;
}

.filters button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 25px;
  table-layout: auto;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

table th, table td {
  padding: 3px 4px;
  text-align: left;
  border: 1px solid #cceeff;
  overflow: hidden; /* 超過的內容隱藏 */
  text-overflow: ellipsis; /* 超過的文字顯示省略號 */
}

table th {
  background-color: #007bff;
  color: #f8f9fa;
  font-weight: bold;
}

table tr:nth-child(even) {
  background-color: #f2f2f2;
}

table tr:hover {
  background-color: #f1f1f1;
}

table td {
  color: #333;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
}

.loading, .error {
  padding: 20px;
  text-align: center;
  font-size: 18px;
}

.loading {
  color: #007bff;
}

.error {
  color: #e74c3c;
  font-weight: bold;
}
</style>
