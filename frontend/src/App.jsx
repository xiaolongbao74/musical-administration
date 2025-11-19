import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import UserKoubanhyou from './components/UserKoubanhyou'
import UserSchedule from './components/UserSchedule'
import AdminMembers from './components/AdminMembers'
import AdminSongs from './components/AdminSongs'
import AdminKoubanhyou from './components/AdminKoubanhyou'
import AdminSchedule from './components/AdminSchedule'

function Navigation() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  if (isAdminPage) {
    // 管理画面ではナビゲーションを表示しない
    return null
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <h1>トムは真夜中の庭で～ハイライト版～</h1>
        <ul className="nav-links">
          <li><Link to="/koubanhyou">香盤表</Link></li>
          <li><Link to="/schedule">スケジュール</Link></li>
        </ul>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Navigate to="/koubanhyou" replace />} />
          <Route path="/koubanhyou" element={<UserKoubanhyou />} />
          <Route path="/schedule" element={<UserSchedule />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/songs" element={<AdminSongs />} />
          <Route path="/admin/koubanhyou" element={<AdminKoubanhyou />} />
          <Route path="/admin/schedule" element={<AdminSchedule />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App