import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function ScheduleForm({ schedule, songs, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    schedule || {
      schedule_date: '',
      venue: '',
      start_time: '',
      end_time: '',
      rehearsal_type: '',
      rehearsal_content: '',
      target_songs: [],
      target_roles: []
    }
  )

  const [roles, setRoles] = useState([])

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_URL}/members`)
      const uniqueRoles = [...new Set(res.data.map(m => m.role))]
      setRoles(uniqueRoles)
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleSongToggle = (songId) => {
    const currentSongs = formData.target_songs || []
    if (currentSongs.includes(songId)) {
      setFormData({
        ...formData,
        target_songs: currentSongs.filter(id => id !== songId)
      })
    } else {
      setFormData({
        ...formData,
        target_songs: [...currentSongs, songId]
      })
    }
  }

  const handleRoleToggle = (role) => {
    const currentRoles = formData.target_roles || []
    if (currentRoles.includes(role)) {
      setFormData({
        ...formData,
        target_roles: currentRoles.filter(r => r !== role)
      })
    } else {
      setFormData({
        ...formData,
        target_roles: [...currentRoles, role]
      })
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <h2>{schedule ? 'スケジュール編集' : 'スケジュール追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>年月日</label>
            <input
              type="date"
              value={formData.schedule_date}
              onChange={e => setFormData({ ...formData, schedule_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>会場</label>
            <input
              type="text"
              value={formData.venue}
              onChange={e => setFormData({ ...formData, venue: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>開始時間</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>終了時間</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>稽古種類</label>
            <input
              type="text"
              value={formData.rehearsal_type}
              onChange={e => setFormData({ ...formData, rehearsal_type: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>稽古内容</label>
            <textarea
              value={formData.rehearsal_content}
              onChange={e => setFormData({ ...formData, rehearsal_content: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>対象曲（複数選択可）</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
              {songs.map(song => (
                <label key={song.id} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={(formData.target_songs || []).includes(song.id)}
                    onChange={() => handleSongToggle(song.id)}
                  />
                  {' '}{song.ba} - M{song.song_number} {song.song_name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>対象役（複数選択可）</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {roles.map(role => (
                <label key={role}>
                  <input
                    type="checkbox"
                    checked={(formData.target_roles || []).includes(role)}
                    onChange={() => handleRoleToggle(role)}
                  />
                  {' '}{role}
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">保存</button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminSchedule() {
  const [members, setMembers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [songs, setSongs] = useState([])
  const [attendance, setAttendance] = useState({})
  const [koubanhyou, setKoubanhyou] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [scheduleRes, songsRes] = await Promise.all([
        axios.get(`${API_URL}/schedules/admin`),
        axios.get(`${API_URL}/songs/active`)
      ])
      
      setMembers(scheduleRes.data.members)
      setSchedules(scheduleRes.data.schedules)
      setAttendance(scheduleRes.data.attendance)
      setKoubanhyou(scheduleRes.data.koubanhyou)
      setSongs(songsRes.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingSchedule(null)
    setShowForm(true)
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingSchedule) {
        await axios.put(`${API_URL}/schedules/${editingSchedule.id}`, formData)
      } else {
        await axios.post(`${API_URL}/schedules`, formData)
      }
      setShowForm(false)
      setEditingSchedule(null)
      fetchData()
    } catch (err) {
      console.error('Error saving schedule:', err)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('本当に削除しますか?')) return
    try {
      await axios.delete(`${API_URL}/schedules/${id}`)
      fetchData()
    } catch (err) {
      console.error('Error deleting schedule:', err)
      alert('削除に失敗しました')
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules/export/csv`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'schedules.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Error exporting:', err)
      alert('エクスポートに失敗しました')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_URL}/schedules/import/csv`, formData)
      fetchData()
      const { inserted, updated, total } = response.data
      alert(`インポートが完了しました\n新規追加: ${inserted}件\n更新: ${updated}件\n合計: ${total}件`)
    } catch (err) {
      console.error('Error importing:', err)
      alert('インポートに失敗しました')
    }
    e.target.value = ''
  }

  const shouldBeGray = (schedule, member) => {
    if (!schedule.target_songs || schedule.target_songs.length === 0) {
      return false
    }

    const memberAssignments = koubanhyou.filter(k => k.member_id === member.id)
    
    if (schedule.target_roles && schedule.target_roles.length > 0) {
      if (!schedule.target_roles.includes(member.role)) {
        return false
      }
    }

    return schedule.target_songs.some(songId => 
      memberAssignments.some(k => k.song_id === songId && k.is_assigned)
    )
  }

  const handleAttendanceChange = async (scheduleId, memberId, value) => {
    try {
      let status, text
      if (['○', '△', '×'].includes(value)) {
        status = value
        text = null
      } else {
        status = 'text'
        text = value
      }

      await axios.post(`${API_URL}/schedules/attendance`, {
        schedule_id: scheduleId,
        member_id: memberId,
        attendance_status: status,
        custom_text: text
      })

      const key = `${scheduleId}_${memberId}`
      setAttendance(prev => ({
        ...prev,
        [key]: { status, text }
      }))
    } catch (err) {
      console.error('Error updating attendance:', err)
    }
  }

  const handleAttendanceClick = (scheduleId, memberId) => {
    const currentValue = getAttendanceValue(scheduleId, memberId)
    let newValue
    
    // Cycle through: empty -> ○ -> △ -> × -> empty
    if (!currentValue || currentValue === '') {
      newValue = '○'
    } else if (currentValue === '○') {
      newValue = '△'
    } else if (currentValue === '△') {
      newValue = '×'
    } else if (currentValue === '×') {
      newValue = ''
    } else {
      // If it's custom text, clear it
      newValue = ''
    }
    
    handleAttendanceChange(scheduleId, memberId, newValue)
  }

  const getAttendanceValue = (scheduleId, memberId) => {
    const key = `${scheduleId}_${memberId}`
    const att = attendance[key]
    if (!att) return ''
    return att.status === 'text' ? att.text : att.status
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = days[date.getDay()]
    return `${year}/${month}/${day}(${dayOfWeek})`
  }

  if (loading) {
    return <div className="container"><div className="loading">読み込み中...</div></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>スケジュール管理</h1>
      </div>

      <div className="admin-tools">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/admin/members" className="btn btn-secondary" style={{ marginRight: '10px' }}>メンバー管理</Link>
          <Link to="/admin/songs" className="btn btn-secondary" style={{ marginRight: '10px' }}>曲管理</Link>
          <Link to="/admin/koubanhyou" className="btn btn-secondary">香盤表管理</Link>
        </div>
        
        <div className="admin-actions">
          <button onClick={handleAdd} className="btn btn-primary">
            スケジュール追加
          </button>
          <button onClick={handleExport} className="btn btn-success">
            CSVエクスポート
          </button>
          <label className="btn btn-success">
            CSVインポート
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
          ※出欠欄をクリック: ○/△/×を順番に切り替え　｜　ダブルクリック: テキスト入力
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sticky-col sticky-col-1" rowSpan="3">年月日</th>
              <th className="sticky-col sticky-col-2" rowSpan="3">会場</th>
              <th className="sticky-col sticky-col-3" rowSpan="3">時間</th>
              <th rowSpan="3">稽古種類</th>
              <th rowSpan="3">稽古内容</th>
              <th rowSpan="3">操作</th>
              {members.map(member => (
                <th key={member.id}>{member.number}</th>
              ))}
            </tr>
            <tr>
              {members.map(member => (
                <th key={member.id}>{member.role}</th>
              ))}
            </tr>
            <tr>
              {members.map(member => (
                <th key={member.id}>{member.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map(schedule => (
              <tr key={schedule.id}>
                <td className="sticky-col sticky-col-1">{formatDate(schedule.schedule_date)}</td>
                <td className="sticky-col sticky-col-2">{schedule.venue}</td>
                <td className="sticky-col sticky-col-3">
                  {schedule.start_time?.slice(0,5)}～{schedule.end_time?.slice(0,5)}
                </td>
                <td>{schedule.rehearsal_type}</td>
                <td>{schedule.rehearsal_content}</td>
                <td>
                  <button onClick={() => handleEdit(schedule)} className="btn btn-small btn-primary">
                    編集
                  </button>
                  {' '}
                  <button onClick={() => handleDelete(schedule.id)} className="btn btn-small btn-danger">
                    削除
                  </button>
                </td>
                {members.map(member => (
                  <td 
                    key={member.id}
                    className={shouldBeGray(schedule, member) ? 'cell-gray' : ''}
                    style={{ padding: '4px', cursor: 'pointer' }}
                    onClick={() => handleAttendanceClick(schedule.id, member.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      const newValue = prompt('出欠状況を入力してください:', getAttendanceValue(schedule.id, member.id))
                      if (newValue !== null) {
                        handleAttendanceChange(schedule.id, member.id, newValue)
                      }
                    }}
                    title="クリック: ○/△/×を切り替え、ダブルクリック: テキスト入力"
                  >
                    <div style={{
                      minHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {getAttendanceValue(schedule.id, member.id)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          songs={songs}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default AdminSchedule
