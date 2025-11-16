import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function MemberForm({ member, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    member || {
      number: '',
      role: '',
      name: '',
      show_in_koubanhyou: true,
      show_in_schedule: true
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{member ? 'メンバー編集' : 'メンバー追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>通し番号</label>
            <input
              type="number"
              value={formData.number}
              onChange={e => setFormData({ ...formData, number: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>役</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>名前</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.show_in_koubanhyou}
                onChange={e => setFormData({ ...formData, show_in_koubanhyou: e.target.checked })}
              />
              {' '}香盤表表示
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.show_in_schedule}
                onChange={e => setFormData({ ...formData, show_in_schedule: e.target.checked })}
              />
              {' '}スケジュール表示
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

function AdminMembers() {
  const [members, setMembers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/members`)
      setMembers(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching members:', err)
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    setShowForm(true)
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setShowForm(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingMember) {
        await axios.put(`${API_URL}/members/${editingMember.id}`, formData)
      } else {
        await axios.post(`${API_URL}/members`, formData)
      }
      setShowForm(false)
      setEditingMember(null)
      fetchMembers()
    } catch (err) {
      console.error('Error saving member:', err)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('本当に削除しますか?')) return
    try {
      await axios.delete(`${API_URL}/members/${id}`)
      fetchMembers()
    } catch (err) {
      console.error('Error deleting member:', err)
      alert('削除に失敗しました')
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/members/export/csv`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'members.csv')
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
      await axios.post(`${API_URL}/members/import/csv`, formData)
      fetchMembers()
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
        <h1>メンバー管理</h1>
      </div>

      <div className="admin-tools">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/admin/songs" className="btn btn-secondary" style={{ marginRight: '10px' }}>曲管理</Link>
          <Link to="/admin/koubanhyou" className="btn btn-secondary" style={{ marginRight: '10px' }}>香盤表管理</Link>
          <Link to="/admin/schedule" className="btn btn-secondary">スケジュール管理</Link>
        </div>
        
        <div className="admin-actions">
          <button onClick={handleAdd} className="btn btn-primary">
            メンバー追加
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
              <th>通し番号</th>
              <th>役</th>
              <th>名前</th>
              <th>香盤表表示</th>
              <th>スケジュール表示</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.number}</td>
                <td>{member.role}</td>
                <td>{member.name}</td>
                <td>{member.show_in_koubanhyou ? '○' : '×'}</td>
                <td>{member.show_in_schedule ? '○' : '×'}</td>
                <td>
                  <button onClick={() => handleEdit(member)} className="btn btn-small btn-primary">
                    編集
                  </button>
                  {' '}
                  <button onClick={() => handleDelete(member.id)} className="btn btn-small btn-danger">
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <MemberForm
          member={editingMember}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default AdminMembers
