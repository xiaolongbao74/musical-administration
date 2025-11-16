import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function UserKoubanhyou() {
  const [members, setMembers] = useState([])
  const [songs, setSongs] = useState([])
  const [matrix, setMatrix] = useState({})
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/koubanhyou/user`)
      setMembers(res.data.members)
      setSongs(res.data.songs)
      setMatrix(res.data.matrix)
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

  const isAssigned = (memberId, songId) => {
    return matrix[`${memberId}_${songId}`] || false
  }

  const displayMembers = selectedMember ? [selectedMember] : members
  const displaySongs = selectedMember 
    ? songs.filter(song => isAssigned(selectedMember.id, song.id))
    : songs

  if (loading) {
    return <div className="container"><div className="loading">読み込み中...</div></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>トムは真夜中の庭で～ハイライト版～</h1>
        <div className="subtitle">香盤表</div>
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
              <th className="sticky-col" rowSpan="3">場</th>
              <th className="sticky-col" rowSpan="3">曲番号</th>
              <th className="sticky-col" rowSpan="3">曲名</th>
              <th className="sticky-col" rowSpan="3">楽譜</th>
              <th className="sticky-col" rowSpan="3">音源</th>
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
            {displaySongs.map(song => (
              <tr key={song.id}>
                <td className="sticky-col">{song.ba}</td>
                <td className="sticky-col">M{song.song_number}</td>
                <td className="sticky-col">{song.song_name}</td>
                <td className="sticky-col">
                  {song.score_link && (
                    <a href={song.score_link} target="_blank" rel="noopener noreferrer">
                      <button className="btn btn-small btn-primary">楽譜</button>
                    </a>
                  )}
                </td>
                <td className="sticky-col">
                  {song.audio_link && (
                    <a href={song.audio_link} target="_blank" rel="noopener noreferrer">
                      <button className="btn btn-small btn-success">音源</button>
                    </a>
                  )}
                </td>
                {displayMembers.map(member => (
                  <td key={member.id}>
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

export default UserKoubanhyou
