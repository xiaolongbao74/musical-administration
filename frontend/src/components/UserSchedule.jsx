import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function TimeScheduleModal({ date, schedules, onClose, selectedMember }) {
  const daySchedules = schedules.filter(s => 
    s.schedule_date.split('T')[0] === date
  )

  const venues = [...new Set(daySchedules.map(s => s.venue))]

  // Calculate time range
  const getTimeInMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const getTimeRange = () => {
    if (daySchedules.length === 0) return { start: 540, end: 1200 } // 9:00-20:00 default
    
    let minTime = 1440 // 24:00
    let maxTime = 0
    
    daySchedules.forEach(s => {
      const start = getTimeInMinutes(s.start_time)
      const end = getTimeInMinutes(s.end_time)
      if (start < minTime) minTime = start
      if (end > maxTime) maxTime = end
    })
    
    // Round to 30-minute intervals
    minTime = Math.floor(minTime / 30) * 30
    maxTime = Math.ceil(maxTime / 30) * 30
    
    return { start: minTime, end: maxTime }
  }

  const timeRange = getTimeRange()
  const timeSlots = []
  for (let time = timeRange.start; time <= timeRange.end; time += 30) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    timeSlots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const getTopPosition = (timeStr) => {
    const minutes = getTimeInMinutes(timeStr)
    return ((minutes - timeRange.start) / 30) * 60 // 60px per 30min
  }

  const getHeight = (startTime, endTime) => {
    const start = getTimeInMinutes(startTime)
    const end = getTimeInMinutes(endTime)
    return ((end - start) / 30) * 60 // 60px per 30min
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
        <h2>タイムスケジュール - {date}</h2>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(90vh - 150px)' }}>
          <div style={{ display: 'flex', minWidth: `${venues.length * 200 + 80}px` }}>
            {/* Time axis */}
            <div style={{ width: '80px', flexShrink: 0, borderRight: '2px solid #333', position: 'relative' }}>
              <div style={{ height: '40px', borderBottom: '1px solid #ddd', fontWeight: 'bold', padding: '10px', background: '#f5f5f5' }}>
                時間
              </div>
              <div style={{ position: 'relative', height: `${timeSlots.length * 60}px` }}>
                {timeSlots.map((time, i) => (
                  <div 
                    key={time} 
                    style={{ 
                      position: 'absolute',
                      top: `${i * 60}px`,
                      width: '100%',
                      height: '60px',
                      borderBottom: '1px solid #ddd',
                      padding: '5px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Venue columns */}
            {venues.map((venue, venueIndex) => (
              <div key={venueIndex} style={{ flex: 1, minWidth: '200px', borderRight: '1px solid #ddd', position: 'relative' }}>
                <div style={{ 
                  height: '40px', 
                  borderBottom: '1px solid #ddd', 
                  fontWeight: 'bold', 
                  padding: '10px',
                  background: '#f5f5f5',
                  textAlign: 'center'
                }}>
                  {venue}
                </div>
                <div style={{ position: 'relative', height: `${timeSlots.length * 60}px` }}>
                  {/* Time grid lines */}
                  {timeSlots.map((time, i) => (
                    <div 
                      key={time}
                      style={{ 
                        position: 'absolute',
                        top: `${i * 60}px`,
                        width: '100%',
                        height: '60px',
                        borderBottom: '1px solid #eee'
                      }}
                    />
                  ))}
                  
                  {/* Schedule blocks */}
                  {daySchedules
                    .filter(s => s.venue === venue)
                    .map((schedule, i) => {
                      const top = getTopPosition(schedule.start_time)
                      const height = getHeight(schedule.start_time, schedule.end_time)
                      
                      return (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            left: '5px',
                            right: '5px',
                            height: `${height - 5}px`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            padding: '8px',
                            color: 'white',
                            fontSize: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          title={`${schedule.start_time?.slice(0,5)}-${schedule.end_time?.slice(0,5)}\n${schedule.rehearsal_type}\n${schedule.rehearsal_content}`}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {schedule.start_time?.slice(0,5)}-{schedule.end_time?.slice(0,5)}
                          </div>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                            {schedule.rehearsal_type}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.9 }}>
                            {schedule.rehearsal_content}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '20px' }}>
          閉じる
        </button>
      </div>
    </div>
  )
}

function UserSchedule() {
  const [members, setMembers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [attendance, setAttendance] = useState({})
  const [koubanhyou, setKoubanhyou] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [showTimeSchedule, setShowTimeSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules/user`)
      setMembers(res.data.members)
      setSchedules(res.data.schedules)
      setAttendance(res.data.attendance)
      setKoubanhyou(res.data.koubanhyou)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const handleMemberClick = (member) => {
    setSelectedMember(member)
  }

  const handleBack = () => {
    setSelectedMember(null)
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

  const getAttendanceDisplay = (scheduleId, memberId) => {
    const key = `${scheduleId}_${memberId}`
    const att = attendance[key]
    if (!att) return ''
    return att.status === 'text' ? att.text : att.status
  }

  const displayMembers = selectedMember ? [selectedMember] : members
  const displaySchedules = selectedMember 
    ? schedules.filter(schedule => shouldBeGray(schedule, selectedMember))
    : schedules

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
        <h1>スケジュール</h1>
      </div>

      {selectedMember && (
        <button onClick={handleBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          ← 戻る
        </button>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sticky-col sticky-col-1" rowSpan="3">年月日</th>
              <th className="sticky-col sticky-col-2" rowSpan="3">会場</th>
              <th className="sticky-col sticky-col-3" rowSpan="3">時間</th>
              <th rowSpan="3">稽古種類</th>
              <th rowSpan="3">稽古内容</th>
              {displayMembers.map(member => (
                <th key={member.id}>{member.number}</th>
              ))}
            </tr>
            <tr>
              {displayMembers.map(member => (
                <th key={member.id}>{member.role}</th>
              ))}
            </tr>
            <tr>
              {displayMembers.map(member => (
                <th key={member.id}>
                  <span 
                    className="member-name" 
                    onClick={() => !selectedMember && handleMemberClick(member)}
                  >
                    {member.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displaySchedules.map(schedule => (
              <tr key={schedule.id}>
                <td 
                  className="sticky-col sticky-col-1 clickable" 
                  onClick={() => setShowTimeSchedule(schedule.schedule_date.split('T')[0])}
                >
                  {formatDate(schedule.schedule_date)}
                </td>
                <td className="sticky-col sticky-col-2">{schedule.venue}</td>
                <td className="sticky-col sticky-col-3">
                  {schedule.start_time?.slice(0,5)}～{schedule.end_time?.slice(0,5)}
                </td>
                <td>{schedule.rehearsal_type}</td>
                <td>{schedule.rehearsal_content}</td>
                {displayMembers.map(member => (
                  <td 
                    key={member.id}
                    className={shouldBeGray(schedule, member) ? 'cell-gray' : ''}
                  >
                    {getAttendanceDisplay(schedule.id, member.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTimeSchedule && (
        <TimeScheduleModal
          date={showTimeSchedule}
          schedules={schedules}
          onClose={() => setShowTimeSchedule(null)}
          selectedMember={selectedMember}
        />
      )}
    </div>
  )
}

export default UserSchedule
