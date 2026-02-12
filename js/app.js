/* ===== APP CORE : Router + Data Layer ===== */
const App = (() => {
    /* --- Default Config --- */
    const CONFIG = {
        ga: {
            1: { name: 'GA 1', questions: 37 },
            2: { name: 'GA 2', questions: 0 },
            3: { name: 'GA 3', questions: 0 },
            4: { name: 'GA 4', questions: 0 },
            5: { name: 'GA 5', questions: 0 },
        },
        projects: {
            1: { name: 'Project 1', questions: 4 },
            2: { name: 'Project 2', questions: 0 },
        },
        roe: { enabled: false, questions: 0 },
        links: [],
    };

    /* --- Dual-Mode Storage: Server API (primary) + localStorage (fallback) --- */
    const LS_KEY = 'tds_store';
    let _store = {
        config: JSON.parse(JSON.stringify(CONFIG)),
        submissions: {},
        bulk: {},
        leaderboard: {},
    };
    let _serverAvailable = false;

    function loadFromLocalStorage() {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY));
            if (saved && saved.config) return saved;
        } catch { }
        return null;
    }

    function saveToLocalStorage() {
        try { localStorage.setItem(LS_KEY, JSON.stringify(_store)); } catch { }
    }

    function ensureStoreFields() {
        if (!_store.config) _store.config = JSON.parse(JSON.stringify(CONFIG));
        if (!_store.config.roe) _store.config.roe = { enabled: false, questions: 0 };
        if (!_store.config.links) _store.config.links = [];
        if (!_store.submissions) _store.submissions = {};
        if (!_store.bulk) _store.bulk = {};
        if (!_store.leaderboard) _store.leaderboard = {};
    }

    async function loadFromServer() {
        try {
            const res = await fetch('/api/data');
            if (res.ok) {
                const data = await res.json();
                if (data && data.config) {
                    _store = data;
                    _serverAvailable = true;
                    ensureStoreFields();
                    saveToLocalStorage(); // cache locally
                    return;
                }
            }
        } catch { }
        // Fallback: try localStorage
        _serverAvailable = false;
        const local = loadFromLocalStorage();
        if (local) {
            _store = local;
        }
        ensureStoreFields();
        console.info(_serverAvailable ? 'Data loaded from server' : 'Using localStorage (server unavailable)');
    }

    function syncToServer() {
        saveToLocalStorage(); // always cache locally
        if (_serverAvailable) {
            fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(_store),
            }).catch(() => { _serverAvailable = false; });
        }
    }

    /* --- Data Layer (reads from in-memory, writes sync to both) --- */
    function getData(key) {
        return _store[key] || {};
    }
    function setData(key, data) {
        _store[key] = data;
        syncToServer();
    }

    function getConfig() {
        const cfg = _store.config;
        if (cfg && cfg.ga) {
            if (!cfg.roe) cfg.roe = { enabled: false, questions: 0 };
            if (!cfg.links) cfg.links = [];
            return cfg;
        }
        return JSON.parse(JSON.stringify(CONFIG));
    }
    function saveConfig(cfg) {
        _store.config = cfg;
        syncToServer();
    }

    function getSubmissions(sectionKey) {
        const all = _store.submissions || {};
        return all[sectionKey] || [];
    }
    function addSubmission(sectionKey, submission) {
        if (!_store.submissions) _store.submissions = {};
        if (!_store.submissions[sectionKey]) _store.submissions[sectionKey] = [];
        submission.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        submission.timestamp = new Date().toISOString();
        _store.submissions[sectionKey].unshift(submission);
        syncToServer();
        Leaderboard.addPoints(submission.rollNo, 10, sectionKey);
        // First submission bonus
        if (_store.submissions[sectionKey].length === 1) {
            Leaderboard.addPoints(submission.rollNo, 5, sectionKey + '_first');
        }
        return submission;
    }
    function deleteSubmission(sectionKey, id) {
        if (!_store.submissions || !_store.submissions[sectionKey]) return;
        _store.submissions[sectionKey] = _store.submissions[sectionKey].filter(s => s.id !== id);
        syncToServer();
    }

    function getBulk(sectionKey) {
        const all = _store.bulk || {};
        return all[sectionKey] || [];
    }
    function addBulk(sectionKey, entry) {
        if (!_store.bulk) _store.bulk = {};
        if (!_store.bulk[sectionKey]) _store.bulk[sectionKey] = [];
        entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        entry.timestamp = new Date().toISOString();
        _store.bulk[sectionKey].unshift(entry);
        syncToServer();
        Leaderboard.addPoints(entry.rollNo, 25, sectionKey + '_bulk');
        return entry;
    }
    function deleteBulk(sectionKey, id) {
        if (!_store.bulk || !_store.bulk[sectionKey]) return;
        _store.bulk[sectionKey] = _store.bulk[sectionKey].filter(s => s.id !== id);
        syncToServer();
    }

    function getSubmissionCount(sectionKey) {
        return getSubmissions(sectionKey).length;
    }

    /* --- Router --- */
    function route() {
        const hash = location.hash || '#/';
        const app = document.getElementById('app');
        app.innerHTML = '';

        const parts = hash.replace('#/', '').split('/').filter(Boolean);

        // Update UI
        updateBreadcrumb(parts);

        if (parts.length === 0) {
            Pages.renderHome(app);
        } else if (parts[0] === 'leaderboard') {
            Pages.renderLeaderboard(app);
        } else if (parts[0] === 'ga' && parts.length === 1) {
            Pages.renderGAList(app);
        } else if (parts[0] === 'ga' && parts.length === 2) {
            Pages.renderQuestions(app, 'ga', parseInt(parts[1]));
        } else if (parts[0] === 'ga' && parts.length === 4 && parts[2] === 'q') {
            Pages.renderFeed(app, 'ga', parseInt(parts[1]), parseInt(parts[3]));
        } else if (parts[0] === 'project' && parts.length === 2) {
            Pages.renderQuestions(app, 'project', parseInt(parts[1]));
        } else if (parts[0] === 'project' && parts.length === 4 && parts[2] === 'q') {
            Pages.renderFeed(app, 'project', parseInt(parts[1]), parseInt(parts[3]));
        } else if (parts[0] === 'roe' && parts.length === 1) {
            Pages.renderQuestions(app, 'roe', 1);
        } else if (parts[0] === 'roe' && parts.length === 3 && parts[1] === 'q') {
            Pages.renderFeed(app, 'roe', 1, parseInt(parts[2]));
        } else {
            app.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div><p>Page not found</p></div>`;
        }
    }

    function updateBreadcrumb(parts) {
        const bc = document.getElementById('breadcrumb');
        if (!bc) return;
        if (parts.length === 0) { bc.innerHTML = ''; return; }

        const cfg = getConfig();
        let html = '';
        const sep = '<span class="sep">›</span>';

        if (parts[0] === 'leaderboard') {
            html = `${sep}<span class="current">Leaderboard</span>`;
        } else if (parts[0] === 'ga') {
            html = `${sep}<a href="#/ga">GA</a>`;
            if (parts.length >= 2) {
                const id = parts[1];
                html += `${sep}<a href="#/ga/${id}">GA ${id}</a>`;
            }
            if (parts.length >= 4 && parts[2] === 'q') {
                html += `${sep}<span class="current">Q${parts[3]}</span>`;
            }
        } else if (parts[0] === 'project') {
            if (parts.length >= 2) {
                const id = parts[1];
                const name = cfg.projects[id] ? cfg.projects[id].name : `Project ${id}`;
                html += `${sep}<a href="#/project/${id}">${name}</a>`;
            }
            if (parts.length >= 4 && parts[2] === 'q') {
                html += `${sep}<span class="current">Q${parts[3]}</span>`;
            }
        } else if (parts[0] === 'roe') {
            html = `${sep}<a href="#/roe">ROE</a>`;
            if (parts.length >= 3 && parts[1] === 'q') {
                html += `${sep}<span class="current">Q${parts[2]}</span>`;
            }
        }
        bc.innerHTML = html;
    }

    /* --- Modal --- */
    function openModal(title, bodyHtml) {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        overlay.classList.remove('hidden');
    }
    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    /* --- Toast --- */
    function toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.classList.add('toast-out');
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    /* --- Markdown --- */
    function renderMD(text) {
        if (!text) return '';
        try {
            if (typeof marked !== 'undefined') {
                if (marked.parse) return marked.parse(text);
                return marked(text);
            }
            return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        } catch {
            return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        }
    }

    /* --- Time --- */
    function timeAgo(iso) {
        const now = new Date();
        const then = new Date(iso);
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return then.toLocaleDateString();
    }

    /* --- Refresh (re-fetch from server and re-render) --- */
    async function refresh() {
        await loadFromServer();
        route();
    }

    /* --- Init --- */
    function init() {
        const navbar = document.getElementById('navbar');
        const app = document.getElementById('app');
        navbar.classList.remove('hidden');
        app.classList.remove('hidden');

        // User badge
        const badge = document.getElementById('user-badge');
        const user = Auth.getUser();
        badge.textContent = user;
        if (Auth.isAdmin()) badge.classList.add('admin');

        // Logout
        document.getElementById('logout-btn').addEventListener('click', Auth.logout);

        // Modal close
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') closeModal();
        });

        // Route
        window.addEventListener('hashchange', route);
        route();

        // Auto-refresh data every 30 seconds
        setInterval(refresh, 30000);
    }

    /* --- Boot (async: load data from server first) --- */
    async function boot() {
        await loadFromServer();
        const authed = Auth.init();
        if (authed) init();
    }

    return {
        boot, init, route, refresh, getConfig, saveConfig,
        getSubmissions, addSubmission, deleteSubmission, getSubmissionCount,
        getBulk, addBulk, deleteBulk,
        openModal, closeModal, toast, renderMD, timeAgo,
        CONFIG, getData, setData,
    };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());
