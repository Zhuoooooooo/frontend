<template>
  <div id="sp-monitor">
    <h1>SP Monitor System</h1>

    <div class="filter-card">
      <div class="filters-container">
        <div class="filter-row top-row">
	  <SiteFilter v-model="form.site" :options="siteList" label="Site" @change="onSiteChange" />
          <ServerFilter v-model="form.server" :options="serverList" label="Server" @change="onServerChange" />
          <DBFilter v-model="form.db" :options="dbList" label="DB" @change="onDBChange" @remote-query="onDBQuery" />
          <SpFilter v-model="form.sp_name" :options="spList" label="SP Name" @remote-query="onSPQuery"/>
        </div>


        <div class="filter-row bottom-row">
          <div class="time-filter-wrapper">
            <TimeFilter v-model="form.time_range" label="Time Interval" />
          </div>
          <div class="button-wrapper">
            <button @click="resetPage(); fetchData()" class="query-button">查詢</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="!data.length">No data</div>

    <table v-if="data.length">
      <thead>
        <tr>
          <th @click="sortBy('Site')" class="sortable">Site {{ getSortIcon('Site') }}</th>
          <th @click="sortBy('Server')" class="sortable">Server {{ getSortIcon('Server') }}</th>
          <th @click="sortBy('DB')" class="sortable">DB {{ getSortIcon('DB') }}</th>
          <th @click="sortBy('SP_Name')" class="sortable">SP Name {{ getSortIcon('SP_Name') }}</th>
          <th @click="sortBy('Exec_Count')" class="sortable">Exec_Count {{ getSortIcon('Exec_Count') }}</th>
          <th @click="sortBy('Exec_Second')" class="sortable">Exec_Second (Avg) {{ getSortIcon('Exec_Second') }}</th>
          <th @click="sortBy('Exec_Error')" class="sortable">Exec_Error {{ getSortIcon('Exec_Error') }}</th>
          <th @click="sortBy('Exec_NO_INDEX_USED')" class="sortable">NO_INDEX_USED {{ getSortIcon('Exec_NO_INDEX_USED') }}</th>
          <th @click="sortBy('Exec_NO_GOOD_INDEX_USED')" class="sortable">NO_GOOD_INDEX_USED {{ getSortIcon('Exec_NO_GOOD_INDEX_USED') }}</th>
          <th @click="sortBy('CreateTime')" class="sortable">CreateTime (UTC+0) {{ getSortIcon('CreateTime') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item,i) in data" :key="i">
	  <td :title="item.Site">{{ item.Site }}</td>
          <td :title="item.Server">{{ item.Server }}</td>
          <td :title="item.DB">{{ item.DB }}</td>
          <td :title="item.SP_Name">{{ item.SP_Name }}</td>
          <td :title="item.Exec_Count">{{ item.Exec_Count }}</td>
          <td :title="item.Exec_Second">{{ item.Exec_Second }}</td>
          <td :title="item.Exec_Error">{{ item.Exec_Error }}</td>
          <td :title="item.Exec_NO_INDEX_USED">{{ item.Exec_NO_INDEX_USED }}</td>
          <td :title="item.Exec_NO_GOOD_INDEX_USED">{{ item.Exec_NO_GOOD_INDEX_USED }}</td>
	  <!--td :title="item.CreateTime">{{ item.CreateTime }}</td-->
	  <td :title="formatDateTime(item.CreateTime)">{{ formatDateTime(item.CreateTime) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
           <td colspan="4"><strong>Total</strong></td>
           <td><strong>{{ totalExecCount }}</strong></td>
           <td><strong>{{ overallAvgSecond }}</strong></td>
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
import SiteFilter from '../components/SiteFilter.vue'
import ServerFilter from '../components/ServerFilter.vue'
import DBFilter from '../components/DBFilter.vue'
import SpFilter from '../components/SpFilter.vue'
import TimeFilter from '../components/TimeFilter.vue'

export default {
  name: 'SpMonitor',
  components: { SiteFilter, ServerFilter, DBFilter, SpFilter, TimeFilter },
  data() {
    return {
            form: { site: [], server: [], db: [], sp_name: [], time_range: { start_time: '', end_time: ''}, db_query: '', sp_query: '' },
      siteList: [],
      serverList: [],
      dbList: [],
      spList: [],
      data: [],
      loading: false,
      error: '',
      sort: {
          field: 'CreateTime',
          direction: 'DESC'
      },
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
    this.fetchServerList();
    this.fetchSiteList()
  },
  computed: {
        overallAvgSecond() {
          if (this.totalExecCount === 0) return 0;
          const avg = this.totalExecSecond / this.totalExecCount;
          return this.RoundToDecimal(avg, 5);
        }
    },
  methods: {
    async fetchSiteList() {
      const res = await axios.get('/api/site_list')
      this.siteList = res.data.map(s => ({ label: s, value: s }))
    },
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
    formatDateTime(dateStr) {
    if (!dateStr) return '--';
    
    const date = new Date(dateStr);
    
    // 如果日期無效，則回傳原始字串
    if (isNaN(date.getTime())) return dateStr;

    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
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
    onSiteChange() {
    this.form.server = []
    this.serverList = []
    this.form.db = []
    this.dbList = []
    this.form.sp_name = []
    this.spList = []
    this.fetchServerList() 
    this.resetPage()
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
    sortBy(field) {
        if (this.sort.field === field) {
            this.sort.direction = this.sort.direction === 'ASC' ? 'DESC' : 'ASC'
        } else {
            this.sort.field = field
            this.sort.direction = 'DESC'
        }
        this.resetPage()
        this.fetchData()
    },
    getSortIcon(field) {
        const icon = ' ▼';

        if (this.sort.field === field) {
            return this.sort.direction === 'ASC' ? ' ▲' : ' ▼';
        } else {
            return icon;
        }
    },
    onTimeChange(newTimeRange) {
        this.resetPage()
    },
    async fetchData() {
      this.loading = true
      this.error = ''

      const params = {
	site: this.form.site?.map(s => s.value).join(',') || '',
        server: this.form.server?.map(s => s.value).join(',') || '',
        db: this.form.db?.map(s => s.value).join(',') || '',
        sp_name: this.form.sp_name?.map(s => s.value).join(',') || '',
        start_time: this.form.time_range.start_time,
        end_time: this.form.time_range.end_time,
        page: this.pagination.current_page,
        per_page: this.pagination.per_page,
        sort_by: this.sort.field,
        sort_dir: this.sort.direction
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
          const count = item.Exec_Count || 0;
          const avgSec = parseFloat(item.Exec_Second) || 0;

          this.totalExecCount += count;
          this.totalExecSecond += (count * avgSec);
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
  margin-bottom: 15px;
  display: flex;
  justify-content: center; /* Horizontally centers */
  align-items: center; /* Vertically centers */
  text-align: center;
}

.filter-card {
  background-color: #ffffff;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); /* 輕微陰影提升深度感 */
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-row {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  width: 100%;
}

.top-row > * {
  flex: 1;
  min-width: 0;
}

.bottom-row {
  justify-content: center;
  border-top: 0.3px solid #f0f3f7; /* 加一條細線分隔，更有層次 */
  padding-top: 18px;
}

.time-filter-wrapper {
  flex: 0 1 auto; /* 保持內容原有的寬度 */
}

.button-wrapper {
  margin-left: 35px; /* 將按鈕推至最右側 */
}

.time-filter {
  flex-direction: column;
  flex-basis: 100%;
  gap: 30px;
  grid-column: span 3;
  display: flex;
}

.query-button {
  padding: 0 32px;
  height: 38px; /* 配合輸入框高度 */
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 25px;
  table-layout: auto;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  table-layout: fixed;
}

table thead th:nth-child(1) {
  width: 4%; /* Site */
}
table thead th:nth-child(2) {
  width: 5%; /* Server */
}
table thead th:nth-child(3) {
  width: 5%; /* DB */
}
table thead th:nth-child(4) {
  width: 20%; /* SP Name */
}
table thead th:nth-child(5) {
  width: 8%; /* Exec_Count */
}
table thead th:nth-child(6) {
  width: 11.5%; /* Exec_Second(Avg) */
}
table thead th:nth-child(7) {
  width: 7.5%; /* Exec_Error */
}
table thead th:nth-child(8) {
  width: 10.5%; /* NO_INDEX_USED */
}
table thead th:nth-child(9) {
  width: 14%; /* NO_GOOD_INDEX_USED */
}
table thead th:nth-child(10) {
  width: 11.5%; /* CreateTime */
}

table th, table td {
  padding: 3px 4px;
  text-align: left;
  border: 1px solid #cceeff;
  white-space: nowrap;
  overflow: hidden; /* 超過的內容隱藏 */
  text-overflow: ellipsis; /* 超過的文字顯示省略號 */
}

table th {
  background-color: #007bff;
  color: #f8f9fa;
  font-weight: bold;
}

table th.sortable {
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

table th.sortable span {
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
