import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function SongForm({ song, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    song || {
      ba: '',
      song_number: '',
      song_name: '',
      score_link: '',
      audio_link: '',
      is_active: true
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{song ? '曲編集' : '曲追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>場</label>
            <input
              type="text"
              value={formData.ba}
              onChange={e => setFormData({ ...formData, ba: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>曲番号</label>
            <input
              type="text"
              value={formData.song_number}
              onChange={e => setFormData({ ...formData, song_number: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>曲名</label>
            <input
              type="text"
              value={formData.song_name}
              onChange={e => setFormData({ ...formData, song_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>楽譜リンク (Dropbox等)</label>
            <input
              type="url"
              value={formData.score_link}
              onChange={e => setFormData({ ...formData, score_link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>音源リンク (Dropbox等)</label>
            <input
              type="url"
              value={formData.audio_link}
              onChange={e => setFormData({ ...formData, audio_link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              />
              {' '}使用有無
            </label>
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

function AdminSongs() {
  const [songs, setSongs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      const res = await axios.get(`${API_URL}/songs`)
      setSongs(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching songs:', err)
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingSong(null)
    setShowForm(true)
  }

  const handleEdit = (song) => {
    setEditingSong(song)
    setShowForm(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingSong) {
        await axios.put(`${API_URL}/songs/${editingSong.id}`, formData)
      } else {
        await axios.post(`${API_URL}/songs`, formData)
      }
      setShowForm(false)
      setEditingSong(null)
      fetchSongs()
    } catch (err) {
      console.error('Error saving song:', err)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('本当に削除しますか?')) return
    try {
      await axios.delete(`${API_URL}/songs/${id}`)
      fetchSongs()
    } catch (err) {
      console.error('Error deleting song:', err)
      alert('削除に失敗しました')
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/songs/export/csv`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'songs.csv')
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
      await axios.post(`${API_URL}/songs/import/csv`, formData)
      fetchSongs()
      alert('インポートが完了しました')
    } catch (err) {
      console.error('Error importing:', err)
      alert('インポートに失敗しました')
    }
    e.target.value = ''
  }

  if (loading) {
    return <div className="container"><div className="loading">読み込み中...</div></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>曲管理</h1>
      </div>

      <div className="admin-tools">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/admin/members" className="btn btn-secondary" style={{ marginRight: '10px' }}>メンバー管理</Link>
          <Link to="/admin/koubanhyou" className="btn btn-secondary" style={{ marginRight: '10px' }}>香盤表管理</Link>
          <Link to="/admin/schedule" className="btn btn-secondary">スケジュール管理</Link>
        </div>
        
        <div className="admin-actions">
          <button onClick={handleAdd} className="btn btn-primary">
            曲追加
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
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>場</th>
              <th>曲番号</th>
              <th>曲名</th>
              <th>楽譜リンク</th>
              <th>音源リンク</th>
              <th>使用有無</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr key={song.id}>
                <td>{song.ba}</td>
                <td>M{song.song_number}</td>
                <td>{song.song_name}</td>
                <td>
                  {song.score_link && (
                    <a href={song.score_link} target="_blank" rel="noopener noreferrer">
                      リンク
                    </a>
                  )}
                </td>
                <td>
                  {song.audio_link && (
                    <a href={song.audio_link} target="_blank" rel="noopener noreferrer">
                      リンク
                    </a>
                  )}
                </td>
                <td>{song.is_active ? '○' : '×'}</td>
                <td>
                  <button onClick={() => handleEdit(song)} className="btn btn-small btn-primary">
                    編集
                  </button>
                  {' '}
                  <button onClick={() => handleDelete(song.id)} className="btn btn-small btn-danger">
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <SongForm
          song={editingSong}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default AdminSongs
