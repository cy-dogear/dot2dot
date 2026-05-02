// postdetail.js
// Dot2Dot 广播详情页 / 全部历史页 - 依赖 common.js

// ========== 全局变量 ==========
let currentUserId = null
let currentMsgId = null
let currentView = 'post'  // 'post' or 'mypost'

// ========== 算法函数（postdetail 特有，不放入 common）==========
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

// ========== 广播详情视图渲染 ==========
function renderPostView(message) {
    const container = document.getElementById('post-detail-container')
    if (!container) return
    
    const userNick = getNickname(message.user_id)
    const parsed = parseMessageTagScore(message.message_tag)
    const content = message.message_content || ''
    
    const html = `
        <div class="broadcast-meta">
            <a href="#" class="user-link" data-user="${escapeHtml(message.user_id)}">${escapeHtml(userNick)}</a>
        </div>
        <div class="broadcast-tag">${escapeHtml(parsed.tag)}</div>
        <div class="broadcast-title">${escapeHtml(message.message_subject || '')}</div>
        <div class="broadcast-content">${escapeHtml(content).replace(/\n/g, '<br>')}</div>
        <div id="related-container" class="related-block">
            <div class="related-title">关联广播</div>
            <div class="text-small">加载中...</div>
        </div>
    `
    
    container.innerHTML = html
    attachUserLinks()
    loadRelatedBroadcasts(message.message_id, 'related-container')
}

async function loadPostView() {
    const container = document.getElementById('post-detail-container')
    if (!container) return
    
    try {
        if (currentMsgId) {
            const message = allMessages.find(m => m.message_id === currentMsgId)
            if (message) {
                renderPostView(message)
                bindNavLinks()
                bindReturnButton()
                return
            }
        }
        
        if (currentUserId) {
            const userMessages = allMessages.filter(m => m.user_id === currentUserId)
            if (userMessages.length > 0) {
                userMessages.sort((a, b) => b.message_id.localeCompare(a.message_id))
                renderPostView(userMessages[0])
                bindNavLinks()
                bindReturnButton()
                return
            }
        }
        
        container.innerHTML = '<div class="error">该用户暂无广播</div>'
    } catch (error) {
        console.error('加载广播详情失败:', error)
        container.innerHTML = '<div class="error">加载失败，请刷新重试</div>'
    }
}

// ========== 全部历史视图渲染 ==========
function renderMypostList() {
    const listContainer = document.getElementById('mypost-list-container')
    const nicknameEl = document.getElementById('mypost-nickname')
    
    if (!listContainer) return
    
    if (!currentUserId) {
        listContainer.innerHTML = '<div class="error">缺少用户信息</div>'
        return
    }
    
    const userMessages = allMessages.filter(m => m.user_id === currentUserId)
    userMessages.sort((a, b) => b.message_id.localeCompare(a.message_id))
    
    const nickname = getNickname(currentUserId)
    if (nicknameEl) nicknameEl.innerText = escapeHtml(nickname)
    
    if (userMessages.length === 0) {
        listContainer.innerHTML = '<div class="empty">暂无广播</div>'
        return
    }
    
    let html = ''
    userMessages.forEach(msg => {
        const msgNick = getNickname(msg.user_id)
        const parsed = parseMessageTagScore(msg.message_tag)
        const summary = (msg.message_content || '').substring(0, 80) + ((msg.message_content || '').length > 80 ? '...' : '')
        const dateStr = msg.message_id.substring(0, 8)
        
        html += `
            <div class="broadcast-item" data-msg-id="${msg.message_id}">
                <div class="broadcast-meta">${dateStr}  · <a href="#" class="user-link" data-user="${escapeHtml(msg.user_id)}">${escapeHtml(msgNick)}</a></div>
                <div class="broadcast-tag">${escapeHtml(parsed.tag)}</div>
                <div class="broadcast-title" data-msg-id="${msg.message_id}" data-user-id="${msg.user_id}">${escapeHtml(msg.message_subject || '')}</div>
                <div class="broadcast-summary">${escapeHtml(summary)}</div>
            </div>
        `
    })
    
    listContainer.innerHTML = html
}

async function loadMypostView() {
    const listContainer = document.getElementById('mypost-list-container')
    if (!listContainer) return
    
    try {
        renderMypostList()
        attachUserLinks()
        attachTitleClicks()
        bindNavLinks()
        bindReturnButton()
    } catch (error) {
        console.error('加载全部历史失败:', error)
        listContainer.innerHTML = '<div class="error">加载失败，请刷新重试</div>'
    }
}

// ========== 事件绑定函数 ==========
function attachUserLinks() {
    document.querySelectorAll('.user-link').forEach(link => {
        link.removeEventListener('click', handleUserLinkClick)
        link.addEventListener('click', handleUserLinkClick)
    })
}

function handleUserLinkClick(e) {
    e.preventDefault()
    const targetUserId = e.currentTarget.getAttribute('data-user')
    if (targetUserId) {
        window.open(`./homepage.html?user=${encodeURIComponent(targetUserId)}`, '_blank')
    }
}

function attachRelatedLinks() {
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

function attachTitleClicks() {
    document.querySelectorAll('.broadcast-title').forEach(title => {
        title.removeEventListener('click', handleTitleClick)
        title.addEventListener('click', handleTitleClick)
    })
}

function handleTitleClick(e) {
    const msgId = e.currentTarget.getAttribute('data-msg-id')
    const userId = e.currentTarget.getAttribute('data-user-id')
    if (msgId && userId) {
        window.open(`./postdetail.html?msg=${encodeURIComponent(msgId)}&user=${encodeURIComponent(userId)}`, '_blank')
    }
}

function bindNavLinks() {
    const postNavs = document.querySelectorAll('.top-nav a[data-view="post"]')
    const mypostNavs = document.querySelectorAll('.top-nav a[data-view="mypost"]')
    
    postNavs.forEach(link => {
        link.removeEventListener('click', handleNavClick)
        link.addEventListener('click', handleNavClick)
    })
    
    mypostNavs.forEach(link => {
        link.removeEventListener('click', handleNavClick)
        link.addEventListener('click', handleNavClick)
    })
}

function handleNavClick(e) {
    e.preventDefault()
    const view = e.currentTarget.getAttribute('data-view')
    if (view === 'post') {
        setView('post')
    } else if (view === 'mypost') {
        setView('mypost')
    }
}

function bindReturnButton() {
    document.querySelectorAll('.back-to-square').forEach(btn => {
        btn.removeEventListener('click', handleReturnClick)
        btn.addEventListener('click', handleReturnClick)
    })
}

function handleReturnClick(e) {
    e.preventDefault()
    if (currentUserId) {
        window.location.href = `./homepage.html?user=${encodeURIComponent(currentUserId)}`
    } else {
        window.location.href = './homepage.html'
    }
}

// ========== 视图切换 ==========
function setView(view) {
    currentView = view
    
    const postView = document.getElementById('post-view')
    const mypostView = document.getElementById('mypost-view')
    const postNav = document.querySelectorAll('.top-nav a[data-view="post"]')
    const mypostNav = document.querySelectorAll('.top-nav a[data-view="mypost"]')
    
    if (view === 'post') {
        if (postView) postView.style.display = 'block'
        if (mypostView) mypostView.style.display = 'none'
        postNav.forEach(link => link.classList.add('active'))
        mypostNav.forEach(link => link.classList.remove('active'))
        loadPostView()
    } else {
        if (postView) postView.style.display = 'none'
        if (mypostView) mypostView.style.display = 'block'
        postNav.forEach(link => link.classList.remove('active'))
        mypostNav.forEach(link => link.classList.add('active'))
        loadMypostView()
    }
}

// ========== 初始化 ==========
async function init() {
    try {
        // 获取 URL 参数
        const viewParam = getUrlParam('view')
        currentMsgId = getUrlParam('msg')
        currentUserId = getUrlParam('user')
        
        // 检查是否有登录用户
        const cachedCurrentUser = getCurrentUserFromCache()
        if (!currentUserId && cachedCurrentUser) {
            currentUserId = cachedCurrentUser.user_id
        }
        
        if (!currentUserId) {
            console.warn('未找到用户信息，跳转到登录页')
            window.location.href = './login.html'
            return
        }
        
        // 显示加载状态
        const postContainer = document.getElementById('post-detail-container')
        if (postContainer) postContainer.innerHTML = '<div class="loading">加载中...</div>'
        
        // 加载数据（使用 common.js 中的 loadAllData）
        await loadAllData()
        
        // 如果没有 msg 但有 user，从消息中获取最新一条
        if (!currentMsgId && currentUserId) {
            const userMessages = allMessages.filter(m => m.user_id === currentUserId)
            if (userMessages.length > 0) {
                userMessages.sort((a, b) => b.message_id.localeCompare(a.message_id))
                currentMsgId = userMessages[0].message_id
            }
        }
        
        // 确定初始视图
        const initialView = (viewParam === 'mypost') ? 'mypost' : 'post'
        
        // 设置视图显示状态
        const postView = document.getElementById('post-view')
        const mypostView = document.getElementById('mypost-view')
        const postNavs = document.querySelectorAll('.top-nav a[data-view="post"]')
        const mypostNavs = document.querySelectorAll('.top-nav a[data-view="mypost"]')
        
        if (initialView === 'post') {
            if (postView) postView.style.display = 'block'
            if (mypostView) mypostView.style.display = 'none'
            postNavs.forEach(link => link.classList.add('active'))
            mypostNavs.forEach(link => link.classList.remove('active'))
            await loadPostView()
        } else {
            if (postView) postView.style.display = 'none'
            if (mypostView) mypostView.style.display = 'block'
            postNavs.forEach(link => link.classList.remove('active'))
            mypostNavs.forEach(link => link.classList.add('active'))
            await loadMypostView()
        }
        
        // 绑定全局事件
        bindNavLinks()
        bindReturnButton()
        
    } catch (error) {
        console.error('初始化失败:', error)
        const container = document.getElementById('post-detail-container')
        if (container) {
            container.innerHTML = `<div class="error">加载失败，请刷新重试<br>${escapeHtml(error.message)}</div>`
        }
    }
}

// 启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}