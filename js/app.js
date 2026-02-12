/* ===== APP CORE : Router + Data Layer ===== */
const App = (() => {
    /* --- Config --- */
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

    const STORAGE_KEYS = {
        submissions: 'tds_submissions',
        bulk: 'tds_bulk',
        leaderboard: 'tds_leaderboard',
        config: 'tds_config',
    };

    /* --- Data Layer --- */
    function getData(key) {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS[key])) || {};
        } catch { return {}; }
    }
    function setData(key, data) {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    }

    function getConfig() {
        const saved = getData('config');
        if (saved && saved.ga) {
            // Ensure new fields exist for older saved configs
            if (!saved.roe) saved.roe = { enabled: false, questions: 0 };
            if (!saved.links) saved.links = [];
            return saved;
        }
        return JSON.parse(JSON.stringify(CONFIG));
    }
    function saveConfig(cfg) {
        setData('config', cfg);
    }

    function getSubmissions(sectionKey) {
        const all = getData('submissions');
        return all[sectionKey] || [];
    }
    function addSubmission(sectionKey, submission) {
        const all = getData('submissions');
        if (!all[sectionKey]) all[sectionKey] = [];
        submission.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        submission.timestamp = new Date().toISOString();
        all[sectionKey].unshift(submission);
        setData('submissions', all);
        Leaderboard.addPoints(submission.rollNo, 10, sectionKey);
        // First submission bonus
        if (all[sectionKey].length === 1) {
            Leaderboard.addPoints(submission.rollNo, 5, sectionKey + '_first');
        }
        return submission;
    }
    function deleteSubmission(sectionKey, id) {
        const all = getData('submissions');
        if (!all[sectionKey]) return;
        all[sectionKey] = all[sectionKey].filter(s => s.id !== id);
        setData('submissions', all);
    }

    function getBulk(sectionKey) {
        const all = getData('bulk');
        return all[sectionKey] || [];
    }
    function addBulk(sectionKey, entry) {
        const all = getData('bulk');
        if (!all[sectionKey]) all[sectionKey] = [];
        entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        entry.timestamp = new Date().toISOString();
        all[sectionKey].unshift(entry);
        setData('bulk', all);
        Leaderboard.addPoints(entry.rollNo, 25, sectionKey + '_bulk');
        return entry;
    }
    function deleteBulk(sectionKey, id) {
        const all = getData('bulk');
        if (!all[sectionKey]) return;
        all[sectionKey] = all[sectionKey].filter(s => s.id !== id);
        setData('bulk', all);
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
    }

    /* --- Boot --- */
    function boot() {
        const authed = Auth.init();
        if (authed) init();
    }

    return {
        boot, init, route, getConfig, saveConfig,
        getSubmissions, addSubmission, deleteSubmission, getSubmissionCount,
        getBulk, addBulk, deleteBulk,
        openModal, closeModal, toast, renderMD, timeAgo,
        CONFIG, getData, setData, STORAGE_KEYS,
    };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());
