import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Übersicht', end: true },
  { to: '/firma/neu', label: 'Neue Firma', end: true },
  { to: '/export', label: 'Export', end: false },
  { to: '/import', label: 'Import', end: false },
]

export default function Layout() {
  const { logout, hasCrmAccess, email } = useAuth()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm flex-wrap md:flex-nowrap">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">Kunden-CRM</Link>
        </div>
        {hasCrmAccess && (
          <div className="navbar-center order-last w-full justify-center md:order-none md:w-auto">
            <ul className="menu menu-horizontal px-1 gap-1">
              {NAV.map(n => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.end} className={({ isActive }) => isActive ? 'bg-primary! text-primary-content! font-medium' : ''}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="navbar-end">
          <button onClick={logout} className="btn btn-ghost btn-sm" title={email ?? ''}>Abmelden</button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {hasCrmAccess ? <Outlet /> : (
          <div className="alert alert-warning">
            <span>Kein Zugriff aufs CRM. Der Benutzer {email} ist nicht für Kundendaten freigeschaltet.</span>
          </div>
        )}
      </main>
    </div>
  )
}
