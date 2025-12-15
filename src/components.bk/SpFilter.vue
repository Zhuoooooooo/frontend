
<template>
  <div class="filter-container">
    <!-- first row -->
    <div class="filter-row">

    <!-- Server List -->
      <div class="filter-item">
        <label>Server</label>
        <Multiselect
          v-model="form.server"
          :options="serverList"
          :searchable="true"
          placeholder="Choose Server"
          :clearable="true"
          label="label"
          track-by="value"
        />
      </div>


    <!-- DB List -->
      <div class="filter-item">
        <label>DB</label>
        <Multiselect
          v-model="form.db"
          :options="dbList"
          :searchable="true"
          placeholder="Choose DB"
          :clearable="true"
          label="label"
          track-by="value"
        />
      </div>

    <!-- SP List -->
      <div class="filter-item">
        <label>SP Name</label>
        <Multiselect
          v-model="form.sp_name"
          :options="spList"
          :searchable="true"
          placeholder="Choose SP Name"
          :clearable="true"
          label="label"
          track-by="value"
          @search-change="fetchSP"
        />
      </div>
    </div>

    <!-- second row -->
    <div class="filter-row">

    <!-- Time Filter -->
      <div class="filter-item">
        <label>StartTime：</label>
        <input type="datetime-local" v-model="form.start_time" />
      </div>
      <div class="filter-item">
        <label>EndTime：</label>
        <input type="datetime-local" v-model="form.end_time" />
      </div>

    <!-- Button -->
      <div class="filter-button">
        <button @click="onSearch">查詢</button>
      </div>
    </div>
  </div>
</template>

<script>
//import { ref, onMounted, watch } from 'vue'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'
import axios from 'axios'


export default {
  name: 'SpFilter',
  components: { Multiselect },
  data() {
    return {
      form: {
        start_time: '',
        end_time: '',
        server: null,
        db: null,
        sp_name: null
      },
      serverList: [],
      dbList: [],
      spList: []
    }
  },
  mounted() {
    this.setDefaultTime()
    this.fetchServer()
    this.fetchDB('')
    this.fetchSP('') // Default show all SP
  },
  methods: {
    // format YYYY-MM-DDTHH:mm:ss
    toDateTime(dt) {
      if (!dt) return ''
      const d = new Date(dt)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
    },
    setDefaultTime() {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      this.form.start_time = this.toDateTime(new Date(yesterday.setHours(0, 0, 0)))
      this.form.end_time = this.toDateTime(new Date(today.setHours(23, 59, 59)))
    },
    async fetchServer() {
      try {
        const res = await axios.get('http://192.168.104.28:3000/list?type=server')
        this.serverList = res.data.map(server => ({ label: server, value: server }))
      } catch (err) {
        console.error('Server list load failed', err)
      }
    },
    async fetchDB(query) {
      try {
        const params = { type: 'db' }
        if (this.form.server) params.server = this.form.server.value
        if (query) params.q = query

        const res = await axios.get('http://192.168.104.28:3000/list', { params })
        this.dbList = res.data.map(db => ({ label: db, value: db }))
      } catch (err) {
        console.error('DB list load failed', err)
      }
    },
    async fetchSP(query) {
      try {
        const params = { type: 'sp' }
        if (this.form.db) params.db = this.form.db.value
        if (query) params.q = query

        const res = await axios.get('http://192.168.104.28:3000/list', { params })
        this.spList = res.data.map(sp => ({ label: sp, value: sp }))
      } catch (err) {
        console.error('SP list load failed', err)
      }
    },
    onSearch() {
      console.log('form.server:', this.form.server)
      console.log('form.db raw:', this.form.db)
      console.log('form.sp_name raw:', this.form.sp_name)
      const payload = {
        server: this.form.server ? this.form.server : '',
        db: this.form.db ? this.form.db : '',
        sp_name: this.form.sp_name ? this.form.sp_name : '',
        start_time: this.toDateTime(this.form.start_time),
        end_time: this.toDateTime(this.form.end_time)
      }
      console.log('SpFilter emit search:', payload)
      this.$emit('search', payload)
    }
  }
}
</script>

<style scoped>
.filter-container {
  flex-wrap: wrap;
  gap: 50px;
  margin-bottom: 30px;
  align-items: center;
}
.filter-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 10px;
}
.filter-item {
  display: flex;
  flex-direction: column;
  flex: 0 0 280px;
}
.filter-item input[type="datetime-local"] {
  height: 38px;
  padding: 4px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.filter-item label {
  margin-bottom: 4px;
}


.filter-button {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  flex-direction: column;
  flex: 0 0 65px;
}

button {
  padding: 7px 18px;
  background-color: #007acc;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  font-weight: 700;
  transition: background-color 0.3s;
}
button:hover {
  background-color: #005f99;
}
</style>

