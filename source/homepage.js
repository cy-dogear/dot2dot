// homepage.js
// Dot2Dot 主页模块 - 依赖 common.js

// ========== 全局变量 ==========
let currentUserId = null
let currentUserInfo = null
let isGuest = false
let currentView = 'platform'  // 'platform' or 'me'

// ========== 算法函数（homepage 特有，不放入 common）==========
function parseMessageTagScore(messageTag) {
    if (!messageTag) return { tag: '', scores: [0, 0, 0, 0] }
    const match = messageTag.match(/^(.*?)\s*\[(\d),(\d),(\d),(\d)\]$/)
    if (match) {
        return {
            tag: match[1],
            scores: [parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5])]
        }
    }
    return { tag: messageTag, scores: [0, 0, 0, 0] }
}

function isBroadcastVisible(message) {
    const { scores } = parseMessageTagScore(message.message_tag)
    return scores.every(s => s !== 0)
}

function getBroadcastQuality(messageTag) {
    const { scores } = parseMessageTagScore(messageTag)
    return scores.reduce((sum, s) => sum + s, 0)
}

function getUserWeightById(userId) {
    const user = allUsers.find(u => u.user_id === userId)
    return user ? user.user_weight : 10
}

function calculateDisplayScore(message) {
    const quality = getBroadcastQuality(message.message_tag)
    const userWeight = getUserWeightById(message.user_id)
    return quality * (userWeight / 10)
}

function weightedRandomSample(items, weights, k) {
    if (items.length <= k) return [...items]
    
    const remainingItems = [...items]
    const remainingWeights = [...weights]
    const result = []
    
    for (let i = 0; i < k && remainingItems.length > 0; i++) {
        let totalWeight = remainingWeights.reduce((sum, w) => sum + w, 0)
        if (totalWeight <= 0) break
        
        let random = Math.random() * totalWeight
        let accumulated = 0
        let selectedIndex = 0
        
        for (let j = 0; j < remainingWeights.length; j++) {
            accumulated += remainingWeights[j]
            if (random <= accumulated) {
                selectedIndex = j
                break
            }
        }
        
        result.push(remainingItems[selectedIndex])
        remainingItems.splice(selectedIndex, 1)
        remainingWeights.splice(selectedIndex, 1)
    }
    return result
}

function containsChinese(text) {
    return /[\u4e00-\u9fff]/.test(text)
}

function extractKeywords(text) {
    if (!text) return []
    
    const verbs = ['约', '找', '求', '学', '读', '看', '听', '玩', '做', '招募', '体验', '思考']
    const keywords = []
    let remaining = text
    
    for (const v of verbs) {
        if (text.startsWith(v)) {
            keywords.push(v)
            remaining = text.slice(v.length)
            break
        }
    }
    
    let i = 0
    const len = remaining.length
    while (i < len) {
        const ch = remaining[i]
        if (containsChinese(ch)) {
            keywords.push(ch)
            i++
        } else if (/[a-zA-Z0-9_]/.test(ch)) {
            let start = i
            while (i < len && /[a-zA-Z0-9_]/.test(remaining[i])) {
                i++
            }
            const word = remaining.slice(start, i)
            if (word) keywords.push(word)
        } else {
            i++
        }
    }
    
    return [...new Set(keywords)]
}

function isRelated(tag1, tag2) {
    if (!tag1 || !tag2) return false
    const kw1 = extractKeywords(tag1)
    const kw2 = extractKeywords(tag2)
    return kw1.some(k => kw2.includes(k))
}

// ========== 渲染单个广播 ==========
function renderBroadcast(message, showRelated = false) {
    const userNick = getNickname(message.user_id)
    const parsed = parseMessageTagScore(message.message_tag)
    const summary = (message.message_content || '').substring(0, 50) + ((message.message_content || '').length > 50 ? '...' : '')
    
    let html = `
        <div class="broadcast-item" data-msg-id="${message.message_id}">
            <div class="broadcast-meta">
                ${isGuest ? escapeHtml(userNick) : `<a href="#" class="user-link" data-user="${message.user_id}">${escapeHtml(userNick)}</a>`}
            </div>
            <div class="broadcast-tag">${escapeHtml(parsed.tag)}</div>
            <div class="broadcast-title" data-msg-id="${message.message_id}" data-user-id="${message.user_id}">${escapeHtml(message.message_subject || '')}</div>
            <div class="broadcast-summary">${escapeHtml(summary)}</div>
    `
    
    if (showRelated && !isGuest && message.message_id) {
        html += `<div class="related-block" id="related-${message.message_id}">
                    <div class="related-title">关联广播</div>
                    <div class="text-small">加载中...</div>
                </div>`
    }
    
    html += `</div>`
    return html
}

// ========== 关联广播加载 ==========
async function loadRelatedBroadcasts(messageId, containerId) {
    const message = allMessages.find(m => m.message_id === messageId)
    if (!message) return
    
    const currentTag = parseMessageTagScore(message.message_tag).tag
    if (!currentTag) return
    
    const relatedMessages = allMessages.filter(m => {
        if (m.message_id === messageId) return false
        if (!isBroadcastVisible(m)) return false
        const mTag = parseMessageTagScore(m.message_tag).tag
        if (!mTag) return false
        return isRelated(currentTag, mTag)
    })
    
    const container = document.getElementById(containerId)
    if (!container) return
    
    if (relatedMessages.length === 0) {
        container.innerHTML = `<div class="related-title">关联广播</div><div class="text-small">暂无关联广播</div>`
        return
    }
    
    const scores = relatedMessages.map(m => calculateDisplayScore(m))
    const selected = weightedRandomSample(relatedMessages, scores, 3)
    
    let html = `<div class="related-title">关联广播</div>`
    selected.forEach(rel => {
        const relParsed = parseMessageTagScore(rel.message_tag)
        html += `
            <div class="related-item">
                <a href="#" class="user-link" data-user="${escapeHtml(rel.user_id)}">${escapeHtml(getNickname(rel.user_id))}</a> · ${escapeHtml(relParsed.tag)}<br>
                <a href="#" class="related-link" data-msg="${escapeHtml(rel.message_id)}" data-user="${escapeHtml(rel.user_id)}">${escapeHtml(rel.message_subject || '')}</a>
            </div>
        `
    })
    container.innerHTML = html
    attachUserLinks()
    attachRelatedLinks()
}

// ========== 平台广场列表渲染 ==========
function renderPlatformList() {
    const container = document.getElementById('platform-list')
    if (!container) return
    
    const visibleMessages = allMessages.filter(m => isBroadcastVisible(m))
    
    if (visibleMessages.length === 0) {
        container.innerHTML = '<p class="text-small">暂无广播</p>'
        return
    }
    
    const scores = visibleMessages.map(m => calculateDisplayScore(m))
    const recommendations = weightedRandomSample(visibleMessages, scores, 10)
    
    container.innerHTML = recommendations.map(msg => renderBroadcast(msg, false)).join('')
    attachUserLinks()
    attachRelatedLinks()
}

// ========== 个人视图渲染 ==========
function renderUserInfo() {
    if (!currentUserInfo) return
    
    const nicknameEl = document.getElementById('user-nickname')
    const emailEl = document.getElementById('user-email')
    const emailForPostEl = document.getElementById('user-email-for-post')
    
    if (nicknameEl) nicknameEl.innerText = escapeHtml(currentUserInfo.nickname)
    if (emailEl) emailEl.innerText = escapeHtml(currentUserInfo.user_id)
    if (emailForPostEl) emailForPostEl.innerText = escapeHtml(currentUserInfo.user_id)
}

function renderMeBroadcastsList() {
    const container = document.getElementById('me-broadcasts-list')
    if (!container) return
    
    if (isGuest || !currentUserId) {
        container.innerHTML = '<p class="text-small">请先登录</p>'
        return
    }
    
    const userMessages = allMessages.filter(m => 
        m.user_id === currentUserId && isBroadcastVisible(m)
    )
    
    if (userMessages.length === 0) {
        container.innerHTML = '<p class="text-small">暂无广播</p>'
        return
    }
    
    const scores = userMessages.map(m => calculateDisplayScore(m))
    const recommendations = weightedRandomSample(userMessages, scores, 3)
    
    container.innerHTML = recommendations.map(msg => renderBroadcast(msg, true)).join('')
    
    recommendations.forEach(msg => {
        const containerId = `related-${msg.message_id}`
        loadRelatedBroadcasts(msg.message_id, containerId)
    })
    
    attachUserLinks()
    attachRelatedLinks()
}

function renderUserTags() {
    const container = document.getElementById('user-tags-container')
    if (!container) return
    
    if (!currentUserInfo || !currentUserInfo.user_tag) {
        container.innerHTML = '<span class="text-small">暂无标签</span>'
        return
    }
    
    const tags = currentUserInfo.user_tag.split(',')
    container.innerHTML = tags.map(t => `<span style="display: inline-block; font-size: 0.8rem; color: #3a3a3a; margin-right: 0.5rem;">${escapeHtml(t.trim())}</span>`).join('')
}

// ========== 搜索功能 ==========
function setupSearch() {
    const searchBtn = document.getElementById('search-submit')
    const searchInput = document.getElementById('search-input')
    const resultsDiv = document.getElementById('search-results')
    
    if (!searchBtn || !searchInput || !resultsDiv) return
    
    const doSearch = async () => {
        const kw = searchInput.value.trim()
        if (!kw) {
            resultsDiv.innerHTML = ''
            return
        }
        
        const searchKeywords = extractKeywords(kw)
        if (searchKeywords.length === 0) {
            resultsDiv.innerHTML = '<div class="text-small">未找到</div>'
            return
        }
        
        const results = []
        for (const msg of allMessages) {
            if (!isBroadcastVisible(msg)) continue
            
            const tag = parseMessageTagScore(msg.message_tag).tag
            const tagKeywords = extractKeywords(tag)
            
            const user = allUsers.find(u => u.user_id === msg.user_id)
            const userKeywords = []
            if (user) {
                userKeywords.push(...extractKeywords(user.nickname))
            }
            userKeywords.push(...extractKeywords(msg.user_id.split('@')[0]))
            
            const matched = searchKeywords.some(k => 
                tagKeywords.includes(k) || userKeywords.includes(k)
            )
            
            if (matched) results.push(msg)
        }
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="text-small">未找到</div>'
        } else {
            results.sort((a, b) => calculateDisplayScore(b) - calculateDisplayScore(a))
            const topResults = results.slice(0, 20)
            resultsDiv.innerHTML = topResults.map(msg => renderBroadcast(msg, false)).join('')
            attachUserLinks()
            attachRelatedLinks()
        }
    }
    
    searchBtn.addEventListener('click', doSearch)
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch() })
}

// ========== 交互绑定 ==========
function attachUserLinks() {
    if (isGuest) return
    
    document.querySelectorAll('.user-link').forEach(link => {
        link.removeEventListener('click', handleUserLinkClick)
        link.addEventListener('click', handleUserLinkClick)
    })
    
    document.querySelectorAll('.broadcast-title').forEach(title => {
        title.removeEventListener('click', handleTitleClick)
        title.addEventListener('click', handleTitleClick)
    })
}

function handleUserLinkClick(e) {
    e.preventDefault()
    const targetUserId = e.currentTarget.getAttribute('data-user')
    if (targetUserId) {
        window.open(`./homepage.html?user=${encodeURIComponent(targetUserId)}&view=me`, '_blank')
    }
}

function handleTitleClick(e) {
    const msgId = e.currentTarget.getAttribute('data-msg-id')
    const userId = e.currentTarget.getAttribute('data-user-id')
    if (msgId && userId && !isGuest) {
        window.open(`./postdetail.html?msg=${encodeURIComponent(msgId)}&user=${encodeURIComponent(userId)}`, '_blank')
    }
}

function attachRelatedLinks() {
    if (isGuest) return
    
    document.querySelectorAll('.related-link').forEach(link => {
        link.removeEventListener('click', handleRelatedLinkClick)
        link.addEventListener('click', handleRelatedLinkClick)
    })
}

function handleRelatedLinkClick(e) {
    e.preventDefault()
    const msgId = e.currentTarget.getAttribute('data-msg')
    const userId = e.currentTarget.getAttribute('data-user')
    if (msgId && userId) {
        window.open(`./postdetail.html?msg=${encodeURIComponent(msgId)}&user=${encodeURIComponent(userId)}`, '_blank')
    }
}

// ========== 视图切换 ==========
function setView(view) {
    if (isGuest && view === 'me') return
    
    currentView = view
    
    const platformView = document.getElementById('platform-view')
    const meView = document.getElementById('me-view')
    const platformNav = document.querySelector('.nav a[data-page="platform"]')
    const meNav = document.querySelector('.nav a[data-page="me"]')
    
    if (view === 'platform') {
        if (platformView) platformView.style.display = 'block'
        if (meView) meView.style.display = 'none'
        if (platformNav) platformNav.classList.add('active')
        if (meNav) meNav.classList.remove('active')
        renderPlatformList()
    } else {
        if (platformView) platformView.style.display = 'none'
        if (meView) meView.style.display = 'block'
        if (platformNav) platformNav.classList.remove('active')
        if (meNav) meNav.classList.add('active')
        renderUserInfo()
        renderUserTags()
        renderMeBroadcastsList()
    }
}

// ========== 按钮事件绑定 ==========
function bindRefreshButtons() {
    const refreshPlatformBtn = document.getElementById('refresh-platform-btn')
    if (refreshPlatformBtn) {
        refreshPlatformBtn.removeEventListener('click', handleRefreshPlatform)
        refreshPlatformBtn.addEventListener('click', handleRefreshPlatform)
    }
    
    const refreshMyBtn = document.getElementById('refresh-my-broadcasts')
    if (refreshMyBtn) {
        refreshMyBtn.removeEventListener('click', handleRefreshMy)
        refreshMyBtn.addEventListener('click', handleRefreshMy)
    }
    
    const loadMoreBtn = document.getElementById('load-more-my-broadcasts')
    if (loadMoreBtn) {
        loadMoreBtn.removeEventListener('click', handleLoadMore)
        loadMoreBtn.addEventListener('click', handleLoadMore)
    }
}

function handleRefreshPlatform() {
    renderPlatformList()
}

function handleRefreshMy() {
    renderMeBroadcastsList()
    renderUserTags()
}

function handleLoadMore() {
    if (currentUserId) {
        window.open(`./postdetail.html?user=${encodeURIComponent(currentUserId)}&view=mypost`, '_blank')
    }
}

function bindNavLinks() {
    const platformLink = document.querySelector('.nav a[data-page="platform"]')
    const meLink = document.querySelector('.nav a[data-page="me"]')
    
    if (platformLink) {
        platformLink.removeEventListener('click', handleNavClick)
        platformLink.addEventListener('click', handleNavClick)
    }
    
    if (meLink && !isGuest) {
        meLink.removeEventListener('click', handleNavClick)
        meLink.addEventListener('click', handleNavClick)
    }
}

function handleNavClick(e) {
    e.preventDefault()
    const page = e.currentTarget.getAttribute('data-page')
    if (page === 'platform') setView('platform')
    else if (page === 'me') setView('me')
}

// ========== 访客模式处理 ==========
function setupGuestMode() {
    if (!isGuest) return
    
    const meNav = document.querySelector('.nav a[data-page="me"]')
    if (meNav) meNav.style.display = 'none'
    
    if (!document.querySelector('.guest-notice')) {
        const guestNotice = document.createElement('div')
        guestNotice.className = 'guest-notice'
        guestNotice.innerHTML = '您正在以访客身份浏览。登录后可查看完整内容并与其他用户互动。'
        const appDiv = document.getElementById('app')
        if (appDiv) {
            appDiv.parentNode.insertBefore(guestNotice, appDiv)
        }
    }
}

// ========== 初始化 ==========
async function init() {
    try {
        // 获取 URL 参数
        const mode = getUrlParam('mode')
        isGuest = (mode === 'guest')
        
        if (!isGuest) {
            // 获取当前用户
            currentUserId = getUrlParam('user')
            
            // 检查 localStorage 中的当前用户
            const cachedCurrentUser = getCurrentUserFromCache()
            if (cachedCurrentUser && !currentUserId) {
                currentUserId = cachedCurrentUser.user_id
                currentUserInfo = cachedCurrentUser
            }
            
            if (!currentUserId) {
                console.warn('未找到用户信息，跳转到登录页')
                window.location.href = './login.html'
                return
            }
        }
        
        // 显示加载状态
        const platformList = document.getElementById('platform-list')
        if (platformList) platformList.innerHTML = '<div class="loading">加载中...</div>'
        
        // 加载数据（访客模式直接从 JSONBin 读取，普通用户只读缓存）
        if (isGuest) {
            await loadFromJSONBin()
        } else {
            const dataLoaded = await loadAllData()
            if (!dataLoaded) {
                console.warn('缓存无效或已过期，跳转到登录页')
                window.location.href = './login.html'
                return
            }
        }
        
        // 获取当前用户完整信息（如果未从缓存获取到）
        if (!isGuest && !currentUserInfo) {
            currentUserInfo = allUsers.find(u => u.user_id === currentUserId)
            if (!currentUserInfo && allUsers.length > 0) {
                currentUserId = allUsers[0].user_id
                currentUserInfo = allUsers[0]
            }
        }
        
        // 更新顶部用户昵称
        const userNickSpan = document.getElementById('user-nick')
        if (userNickSpan) {
            if (isGuest) {
                userNickSpan.innerText = '访客'
            } else if (currentUserInfo) {
                userNickSpan.innerText = currentUserInfo.nickname
            } else {
                userNickSpan.innerText = '用户'
            }
        }
        
        // 个人视图中显示当前用户昵称（如果是登录状态）
        if (!isGuest && currentUserInfo) {
            const meNav = document.querySelector('.nav a[data-page="me"]')
            if (meNav) meNav.innerText = currentUserInfo.nickname
        }
        
        // 访客模式设置
        setupGuestMode()
        
        // 获取视图参数
        const viewParam = getUrlParam('view')
        const initialView = (viewParam === 'me' && !isGuest) ? 'me' : 'platform'
        
        // 设置视图显示状态
        const platformView = document.getElementById('platform-view')
        const meView = document.getElementById('me-view')
        if (platformView) platformView.style.display = initialView === 'platform' ? 'block' : 'none'
        if (meView) meView.style.display = initialView === 'me' ? 'block' : 'none'
        
        // 设置导航激活状态
        const platformNav = document.querySelector('.nav a[data-page="platform"]')
        const meNav = document.querySelector('.nav a[data-page="me"]')
        if (platformNav) {
            if (initialView === 'platform') platformNav.classList.add('active')
            else platformNav.classList.remove('active')
        }
        if (meNav) {
            if (initialView === 'me') meNav.classList.add('active')
            else meNav.classList.remove('active')
        }
        
        // 渲染初始视图
        if (initialView === 'platform') {
            currentView = 'platform'
            renderPlatformList()
        } else {
            currentView = 'me'
            renderUserInfo()
            renderUserTags()
            renderMeBroadcastsList()
        }
        
        // 绑定事件
        bindRefreshButtons()
        bindNavLinks()
        setupSearch()
        
    } catch (error) {
        console.error('初始化失败:', error)
        const platformList = document.getElementById('platform-list')
        if (platformList) {
            platformList.innerHTML = `<div class="card"><p class="text-small">加载失败，请刷新重试</p><p class="text-small">${error.message}</p></div>`
        }
    }
}

// 启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}