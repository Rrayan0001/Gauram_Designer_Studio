export const AUTH_CREDENTIALS = {
  username: 'admin',
  password: 'admin123456@gauram',
}

export const AUTH_COOKIE_NAME = 'gds_session'

export function setSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; max-age=86400; SameSite=Lax`
    try {
      localStorage.setItem(AUTH_COOKIE_NAME, 'authenticated')
    } catch {
      /* ignore */
    }
  }
}

export function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    try {
      localStorage.removeItem(AUTH_COOKIE_NAME)
    } catch {
      /* ignore */
    }
  }
}

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false
  const hasCookie = document.cookie.includes(`${AUTH_COOKIE_NAME}=authenticated`)
  let hasStorage = false
  try {
    hasStorage = localStorage.getItem(AUTH_COOKIE_NAME) === 'authenticated'
  } catch {
    /* ignore */
  }
  return hasCookie || hasStorage
}
