// common.js
// Dot2Dot 公共模块 - 配置 + 数据层 + 工具函数

// ========== 配置常量 ==========
const USERS_BIN_ID = '69f14522856a6821898445a4'
const MESSAGES_BIN_ID = '69f152d436566621a802f2ba'
const JSONBIN_MASTER_KEY = '$2a$10$NnXwFiHdeGX5Q4Gv9IigV..OROpZWRDPiLvnGapCf4fX4Io7VIQVq'

const STORAGE_KEYS = {
    USERS: 'dot2dot_users',
    MESSAGES: 'dot2dot_messages',
    CURRENT_USER: 'dot2dot_currentUser',
    TIMESTAMP: 'dot2dot_timestamp'
}

// 缓存有效期（10小时）
const CACHE_DURATION = 10 * 60 * 60 * 1000

// ========== 全局共享状态 ==========
let allUsers = []
let allMessages = []

// ========== 工具函数 ==========
function escapeHtml(str) {
    if (!str) return ''
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'
        if (m === '<') return '&lt;'
        if (m === '>') return '&gt;'
        return m
    })
}

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(param)
}

function getNickname(userId) {
    const user = allUsers.find(u => u.user_id === userId)
    return user ? user.nickname : (userId ? userId.split('@')[0] : '用户')
}

// ========== API 读取 ==========
async function fetchUsers() {
    const url = `https://api.jsonbin.io/v3/b/${USERS_BIN_ID}/latest`
    const response = await fetch(url, {
        headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    })
    if (!response.ok) throw new Error(`读取用户数据失败: ${response.status}`)
    const data = await response.json()
    return data.record || []
}

async function fetchMessages() {
    const url = `https://api.jsonbin.io/v3/b/${MESSAGES_BIN_ID}/latest`
    const response = await fetch(url, {
        headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    })
    if (!response.ok) throw new Error(`读取广播数据失败: ${response.status}`)
    const data = await response.json()
    return data.record || []
}

// ========== localStorage 缓存操作 ==========
function loadFromLocalStorage() {
    const usersJson = localStorage.getItem(STORAGE_KEYS.USERS)
    const messagesJson = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP)
    
    if (!usersJson || !messagesJson || !timestamp) {
        return false
    }
    
    const age = Date.now() - parseInt(timestamp)
    if (age >= CACHE_DURATION) {
        console.log('localStorage 缓存已过期')
        return false
    }
    
    try {
        allUsers = JSON.parse(usersJson)
        allMessages = JSON.parse(messagesJson)
        console.log(`从 localStorage 加载数据: ${allUsers.length} 用户, ${allMessages.length} 广播`)
        return true
    } catch (e) {
        console.warn('解析 localStorage 数据失败:', e)
        return false
    }
}

async function loadFromJSONBin() {
    console.log('从 JSONBin 加载数据...')
    const [users, messages] = await Promise.all([fetchUsers(), fetchMessages()])
    
    if (!Array.isArray(users) || users.length === 0) {
        throw new Error('用户数据异常')
    }
    
    allUsers = users
    allMessages = messages
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString())
    console.log('数据已存入 localStorage')
    
    return true
}

async function loadAllData() {
    // 只从 localStorage 读取，无效则返回 false，不自动请求 JSONBin
    if (loadFromLocalStorage()) {
        return true
    }
    return false
}

// ========== 当前用户操作 ==========
function getCurrentUserFromCache() {
    const cached = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (!cached) return null
    try {
        return JSON.parse(cached)
    } catch {
        return null
    }
}

function saveCurrentUserToCache(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
}

function clearCurrentUserCache() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

function clearAllCache() {
    localStorage.removeItem(STORAGE_KEYS.USERS)
    localStorage.removeItem(STORAGE_KEYS.MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP)
}