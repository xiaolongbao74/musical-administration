import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function TimeScheduleModal({ date, schedules, onClose, selectedMember }) {
  const daySchedules = schedules.filter(s => 
    s.schedule_date.split('T')[0] === date
  )

  const venues = [...new Set(daySchedules.map(s => s.venue))]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>タイムスケジュール - {date}</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>時間</th>
                {venues.map((venue, i) => (
                  <th key={i}>{venue}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daySchedules.map((schedule, i) => (
                <tr key={i}>
                  <td>{schedule.start_time?.slice(0,5)} - {schedule.end_time?.slice(0,5)}</td>
                  {venues.map((venue, j) => (
                    <td key={j}>
                      {schedule.venue === venue && (
                        <div>
                          <div><strong>{schedule.rehearsal_type}</strong></div>
                          <div>{schedule.rehearsal_content}</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
              <th className="sticky-col" rowSpan="3">年月日</th>
              <th className="sticky-col" rowSpan="3">会場</th>
              <th className="sticky-col" rowSpan="3">時間</th>
              <th className="sticky-col" rowSpan="3">稽古種類</th>
              <th className="sticky-col" rowSpan="3">稽古内容</th>
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
                  className="sticky-col clickable" 
                  onClick={() => setShowTimeSchedule(schedule.schedule_date.split('T')[0])}
                >
                  {formatDate(schedule.schedule_date)}
                </td>
                <td className="sticky-col">{schedule.venue}</td>
                <td className="sticky-col">
                  {schedule.start_time?.slice(0,5)}～{schedule.end_time?.slice(0,5)}
                </td>
                <td className="sticky-col">{schedule.rehearsal_type}</td>
                <td className="sticky-col">{schedule.rehearsal_content}</td>
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
