import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function AdminKoubanhyou() {
  const [members, setMembers] = useState([])
  const [songs, setSongs] = useState([])
  const [matrix, setMatrix] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/koubanhyou/admin`)
      setMembers(res.data.members)
      setSongs(res.data.songs)
      setMatrix(res.data.matrix)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const handleToggle = async (memberId, songId) => {
    try {
      await axios.post(`${API_URL}/koubanhyou/toggle`, {
        member_id: memberId,
        song_id: songId
      })
      
      // Update local state
      const key = `${memberId}_${songId}`
      setMatrix(prev => ({
        ...prev,
        [key]: !prev[key]
      }))
    } catch (err) {
      console.error('Error toggling assignment:', err)
      alert('更新に失敗しました')
    }
  }

  const isAssigned = (memberId, songId) => {
    return matrix[`${memberId}_${songId}`] || false
  }

  if (loading) {
    return <div className="container"><div className="loading">読み込み中...</div></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>香盤表管理</h1>
      </div>

      <div className="admin-tools">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/admin/members" className="btn btn-secondary" style={{ marginRight: '10px' }}>メンバー管理</Link>
          <Link to="/admin/songs" className="btn btn-secondary" style={{ marginRight: '10px' }}>曲管理</Link>
          <Link to="/admin/schedule" className="btn btn-secondary">スケジュール管理</Link>
        </div>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
          ※各セルをクリックすると「○」と空欄が切り替わります
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sticky-col sticky-col-1" rowSpan="3">場</th>
              <th className="sticky-col sticky-col-2" rowSpan="3">曲番号</th>
              <th rowSpan="3">曲名</th>
              <th rowSpan="3">楽譜</th>
              <th rowSpan="3">音源</th>
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
            {songs.map(song => (
              <tr key={song.id}>
                <td className="sticky-col sticky-col-1">{song.ba}</td>
                <td className="sticky-col sticky-col-2">M{song.song_number}</td>
                <td>{song.song_name}</td>
                <td>
                  {song.score_link && (
                    <a href={song.score_link} target="_blank" rel="noopener noreferrer">
                      <button className="btn btn-small btn-primary">楽譜</button>
                    </a>
                  )}
                </td>
                <td>
                  {song.audio_link && (
                    <a href={song.audio_link} target="_blank" rel="noopener noreferrer">
                      <button className="btn btn-small btn-success">音源</button>
                    </a>
                  )}
                </td>
                {members.map(member => (
                  <td 
                    key={member.id}
                    className="clickable"
                    onClick={() => handleToggle(member.id, song.id)}
                  >
                    {isAssigned(member.id, song.id) && (
                      <span className="cell-assigned">○</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminKoubanhyou
