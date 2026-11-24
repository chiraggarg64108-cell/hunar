import { createContext, useContext, useState, useEffect } from 'react'
import { getWorkers } from '../data/seedData'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_current_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Synchronize workerId if a worker was created or exists
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hc_current_user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('hc_current_user')
    }
  }, [currentUser])

  const login = (name, phone) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10)
    // Check if a worker already exists with this phone or name in database
    const workers = getWorkers()
    const existingWorker = workers.find(w => w.phone === cleanPhone || (w.name.toLowerCase() === name.toLowerCase()))

    const user = {
      name: existingWorker ? existingWorker.name : name.trim(),
      phone: cleanPhone,
      workerId: existingWorker ? existingWorker.id : null,
      loginAt: Date.now()
    }

    setCurrentUser(user)
    localStorage.setItem(`hc_user_${cleanPhone}`, JSON.stringify(user))
    return user
  }

  const linkWorkerProfile = (workerId) => {
    setCurrentUser(prev => {
      if (!prev) return null
      const updated = { ...prev, workerId }
      localStorage.setItem(`hc_user_${prev.phone}`, JSON.stringify(updated))
      return updated
    })
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('hc_current_user')
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, linkWorkerProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
