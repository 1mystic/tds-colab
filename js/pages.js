/* ===== PAGE RENDERERS ===== */
const Pages = (() => {

  /* ===== HOME PAGE ===== */
  function renderHome(container) {
    const cfg = App.getConfig();
    const gaCount = Object.values(cfg.ga).filter(g => g && g.questions > 0).length;
    const gaTotal = Object.values(cfg.ga).filter(g => g).length;

    // Build project cards dynamically from config
    const projColors = [
      { bg: 'rgba(192,132,252,0.08)', color: 'var(--accent-purple)', border: 'rgba(192,132,252,0.1)', cardClass: 'card-p1' },
      { bg: 'rgba(110,231,183,0.08)', color: 'var(--accent-green)', border: 'rgba(110,231,183,0.1)', cardClass: 'card-p2' },
      { bg: 'rgba(251,191,36,0.08)', color: 'var(--accent-amber)', border: 'rgba(251,191,36,0.1)', cardClass: 'card-p1' },
      { bg: 'rgba(251,113,133,0.08)', color: 'var(--accent-rose)', border: 'rgba(251,113,133,0.1)', cardClass: 'card-p2' },
    ];
    const projIcons = [
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>',
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    ];

    let projCardsHtml = '';
    const projIds = Object.keys(cfg.projects).sort((a, b) => a - b);
    projIds.forEach((id, idx) => {
      const p = cfg.projects[id];
      if (!p) return; // Skip nulls (from Firebase sparse arrays)
      const theme = projColors[idx % projColors.length];
      const icon = projIcons[idx % projIcons.length];
      projCardsHtml += `
        <div class="glass-card ${theme.cardClass} animate-in stagger-${idx + 2}" onclick="location.hash='#/project/${id}'">
          <span class="card-icon">${icon}</span>
          <div class="card-title">${p.name}</div>
          <div class="card-desc">${p.questions} questions</div>
          <span class="card-badge" style="background:${theme.bg};color:${theme.color};border-color:${theme.border}">P${id}</span>
        </div>`;
    });

    // ROE card (hidden unless enabled by admin)
    let roeCardHtml = '';
    if (cfg.roe && cfg.roe.enabled) {
      roeCardHtml = `
        <div class="glass-card card-roe animate-in stagger-${projIds.length + 2}" onclick="location.hash='#/roe'">
          <span class="card-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
          <div class="card-title">ROE</div>
          <div class="card-desc">${cfg.roe.questions} questions</div>
          <span class="card-badge" style="background:rgba(251,191,36,0.08);color:var(--accent-amber);border-color:rgba(251,191,36,0.1)">ROE</span>
        </div>`;
    }

    // Useful links section
    const links = cfg.links || [];
    let linksHtml = '';
    if (links.length > 0 || Auth.isAdmin()) {
      linksHtml = `<div class="useful-links-section animate-in">
        <div class="links-header">
          <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-2px;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> Useful Links</h3>
          ${Auth.isAdmin() ? `<button class="btn btn-ghost btn-sm" onclick="Admin.openAddLinkModal()">${Admin.ICONS.plus} Add Link</button>` : ''}
        </div>
        ${links.length > 0 ? `<div class="links-grid">${links.map((l, i) => `
          <a href="${l.url}" target="_blank" rel="noopener" class="link-card">
            <div class="link-title">${l.title}</div>
            ${l.desc ? `<div class="link-desc">${l.desc}</div>` : ''}
            ${Auth.isAdmin() ? `<button class="link-delete-btn" onclick="event.preventDefault();event.stopPropagation();Admin.deleteLink(${i})" title="Delete">${Admin.ICONS.trash}</button>` : ''}
          </a>`).join('')}</div>` : '<p style="color:var(--text-muted);font-size:13px;">No links added yet.</p>'}
      </div>`;
    }

    container.innerHTML = `
      <div class="home-header">
        <h1><span>TDS T1 26</span></h1>
        <p>Tools in Data Science : Collaborative Hub</p>
      </div>
      <div class="home-grid">
        <div class="glass-card card-ga animate-in stagger-1" onclick="location.hash='#/ga'">
          <span class="card-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg></span>
          <div class="card-title">Graded Assignments</div>
          <div class="card-desc">${gaTotal} GAs with collaborative answers</div>
          <span class="card-badge">${gaCount} active</span>
        </div>
        ${projCardsHtml}
        ${roeCardHtml}
      </div>
      ${Auth.isAdmin() ? `
      <div style="margin-top:32px;text-align:center;">
        <button class="btn btn-ghost btn-sm" onclick="Admin.openConfigModal()">${Admin.ICONS.settings} Admin: Edit Config</button>
      </div>` : ''}
      ${linksHtml}
    `;
  }

  /* ===== GA LISTING ===== */
  function renderGAList(container) {
    const cfg = App.getConfig();
    let cardsHtml = '';
    const gaIds = Object.keys(cfg.ga).sort((a, b) => a - b);
    gaIds.forEach((id, idx) => {
      const ga = cfg.ga[id];
      if (!ga) return;

      const qCount = ga.questions;
      const totalSubs = countSectionSubmissions('ga', id, qCount);
      cardsHtml += `
        <div class="item-card animate-in stagger-${idx + 1}" onclick="location.hash='#/ga/${id}'">
          <div class="item-name">
            <span class="item-num">${String(id).padStart(2, '0')}</span>
            ${ga.name}
          </div>
          <div class="item-meta">
            <span class="count">${qCount} Q</span>
            <span>${totalSubs} submissions</span>
            <span class="item-arrow">→</span>
          </div>
        </div>`;
    });

    const bulkEntries = App.getBulk('ga-all');
    let bulkHtml = renderBulkSection(bulkEntries, 'ga-all');

    container.innerHTML = `
      <div class="page-header">
        <h2>Graded Assignments</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Pages.openBulkModal('ga-all', 'GA : All Assignments')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Create
          </button>
        </div>
      </div>
      ${cardsHtml ? `<div class="item-list">${cardsHtml}</div>` : emptyState('No graded assignments configured yet.')}
      ${bulkHtml}
    `;
  }

  /* ===== QUESTIONS PAGE ===== */
  function renderQuestions(container, type, id) {
    const cfg = App.getConfig();
    let section, title, sectionKey;

    if (type === 'roe') {
      section = cfg.roe;
      title = 'ROE';
      sectionKey = 'roe';
    } else {
      section = type === 'ga' ? cfg.ga[id] : cfg.projects[id];
      title = section ? section.name : `${type} ${id}`;
      sectionKey = `${type}-${id}`;
    }

    if (!section) { container.innerHTML = emptyState('Section not found'); return; }

    const qCount = section.questions;

    let chipsHtml = '';
    if (qCount > 0) {
      for (let q = 1; q <= qCount; q++) {
        const key = type === 'roe' ? `roe-q-${q}` : `${sectionKey}-q-${q}`;
        const count = App.getSubmissionCount(key);
        chipsHtml += `
          <div class="q-chip ${count > 0 ? 'has-answers' : ''}" 
               onclick="location.hash='#/${type === 'roe' ? 'roe' : type + '/' + id}/q/${q}'"
               title="Q${q} : ${count} submissions">
            ${q}
            ${count > 0 ? '<span class="q-dot"></span>' : ''}
          </div>`;
      }
    }

    const bulkKey = type === 'roe' ? 'roe' : sectionKey;
    const bulkEntries = App.getBulk(bulkKey);
    let bulkHtml = renderBulkSection(bulkEntries, bulkKey);

    const editBtn = Auth.isAdmin() && type !== 'roe'
      ? `<button class="btn btn-ghost btn-sm" onclick="Admin.openEditQuestions('${type}', '${id}')">${Admin.ICONS.edit} Edit</button>`
      : (Auth.isAdmin() && type === 'roe'
        ? `<button class="btn btn-ghost btn-sm" onclick="Admin.openEditQuestions('roe', '1')">${Admin.ICONS.edit} Edit</button>`
        : '');

    container.innerHTML = `
      <div class="page-header">
        <h2>${title}</h2>
        <div class="page-actions">
          ${editBtn}
          <button class="btn btn-primary" onclick="Pages.openBulkModal('${bulkKey}', '${title} : Full Solution')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Create
          </button>
        </div>
      </div>
      ${qCount > 0 ? `<div class="question-grid">${chipsHtml}</div>` : emptyState('No questions configured yet')}
      ${bulkHtml}
    `;
  }

  /* ===== SUBMISSION FEED ===== */
  function renderFeed(container, type, id, qid) {
    const cfg = App.getConfig();
    let title, sectionKey;

    if (type === 'roe') {
      title = 'ROE';
      sectionKey = `roe-q-${qid}`;
    } else {
      const section = type === 'ga' ? cfg.ga[id] : cfg.projects[id];
      title = section ? section.name : `${type} ${id}`;
      sectionKey = `${type}-${id}-q-${qid}`;
    }
    const submissions = App.getSubmissions(sectionKey);

    let feedHtml = '';
    if (submissions.length === 0) {
      feedHtml = emptyState('No submissions yet. Be the first!');
    } else {
      submissions.forEach((s, i) => {
        feedHtml += renderFeedCard(s, sectionKey, i);
      });
    }

    container.innerHTML = `
      <div class="page-header">
        <h2>${title} : Question ${qid}</h2>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Pages.openSubmissionModal('${sectionKey}', '${title} Q${qid}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Create
          </button>
        </div>
      </div>
      <div class="feed-list">${feedHtml}</div>
    `;
  }

  /* ===== FEED CARD ===== */
  function renderFeedCard(s, sectionKey, idx) {
    const isAdmin = Auth.isAdmin();
    const isOwner = Auth.getUser() === s.rollNo;
    const canDelete = isAdmin || isOwner;
    const avatarLetters = s.rollNo.slice(0, 2).toUpperCase();

    return `
      <div class="feed-card animate-in" style="animation-delay:${idx * 0.08}s">
        <div class="feed-card-header">
          <div class="feed-user">
            <div class="feed-avatar">${avatarLetters}</div>
            <div class="feed-user-info">
              <div class="feed-roll">${s.rollNo}</div>
              <div class="feed-time">${App.timeAgo(s.timestamp)}</div>
            </div>
          </div>
          <div class="feed-actions">
            ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="Pages.deleteSubmission('${sectionKey}','${s.id}')">Delete</button>` : ''}
          </div>
        </div>
        <div class="feed-section">
          <div class="feed-section-label"><span class="dot dot-cyan"></span>Question Statement</div>
          <div class="feed-section-content">${App.renderMD(s.questionStatement)}</div>
        </div>
        <div class="feed-section">
          <div class="feed-section-label"><span class="dot dot-purple"></span>Answer</div>
          <div class="feed-section-content">${App.renderMD(s.answer)}</div>
        </div>
        <div class="feed-section">
          <div class="feed-section-label"><span class="dot dot-green"></span>Solution Approach</div>
          <div class="feed-section-content">${App.renderMD(s.solution)}</div>
        </div>
      </div>`;
  }

  /* ===== BULK SECTION ===== */
  function renderBulkSection(entries, sectionKey) {
    if (entries.length === 0) return '';
    let html = '<div class="bulk-section"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> Full Solutions</h3>';
    html += '<div class="feed-list">';
    entries.forEach((e, i) => {
      const canDelete = Auth.isAdmin() || Auth.getUser() === e.rollNo;
      const avatarLetters = e.rollNo.slice(0, 2).toUpperCase();
      html += `
        <div class="feed-card animate-in" style="animation-delay:${i * 0.08}s">
          <div class="feed-card-header">
            <div class="feed-user">
              <div class="feed-avatar">${avatarLetters}</div>
              <div class="feed-user-info">
                <div class="feed-roll">${e.rollNo}</div>
                <div class="feed-time">${App.timeAgo(e.timestamp)}</div>
              </div>
            </div>
            <div class="feed-actions">
              ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="Pages.deleteBulkEntry('${sectionKey}','${e.id}')">Delete</button>` : ''}
            </div>
          </div>
          <div class="feed-section">
            <div class="feed-section-label"><span class="dot dot-cyan"></span>Full Markdown</div>
            <div class="feed-section-content">${App.renderMD(e.markdownContent)}</div>
          </div>
        </div>`;
    });
    html += '</div></div>';
    return html;
  }

  /* ===== MODALS ===== */
  function openSubmissionModal(sectionKey, title) {
    const html = `
      <div class="form-group">
        <label class="form-label">Question Statement</label>
        <textarea id="field-qs" class="form-textarea" placeholder="Paste the question statement (supports Markdown)..."></textarea>
        <div class="form-hint">Supports Markdown syntax</div>
      </div>
      <div class="form-group">
        <label class="form-label">Answer</label>
        <textarea id="field-ans" class="form-textarea" placeholder="Your answer (supports Markdown)..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Solution Approach</label>
        <textarea id="field-sol" class="form-textarea" placeholder="Explain your approach (supports Markdown)..."></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Pages.submitAnswer('${sectionKey}')">Submit</button>
      </div>`;
    App.openModal(`New Submission : ${title}`, html);
  }

  function submitAnswer(sectionKey) {
    const qs = document.getElementById('field-qs').value.trim();
    const ans = document.getElementById('field-ans').value.trim();
    const sol = document.getElementById('field-sol').value.trim();
    if (!ans) {
      App.toast('Please provide an answer', 'error');
      return;
    }
    App.addSubmission(sectionKey, {
      rollNo: Auth.getUser(),
      questionStatement: qs,
      answer: ans,
      solution: sol,
    });
    App.closeModal();
    App.toast('Submission added! +10 pts', 'success');
    App.route();
  }

  function openBulkModal(sectionKey, title) {
    const html = `
      <div class="form-group">
        <label class="form-label">Full Markdown Content</label>
        <textarea id="field-bulk" class="form-textarea large" placeholder="Paste your full solution in Markdown format..."></textarea>
        <div class="form-hint">Supports full Markdown : code blocks, tables, lists, etc.</div>
      </div>
      <div id="bulk-preview" class="form-preview" style="display:none;"></div>
      <div style="margin-top:8px;">
        <button class="btn btn-ghost btn-sm" onclick="Pages.toggleBulkPreview()">Preview</button>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="Pages.submitBulk('${sectionKey}')">Submit</button>
      </div>`;
    App.openModal(`Full Solution : ${title}`, html);
  }

  function toggleBulkPreview() {
    const textarea = document.getElementById('field-bulk');
    const preview = document.getElementById('bulk-preview');
    if (preview.style.display === 'none') {
      preview.innerHTML = App.renderMD(textarea.value);
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  function submitBulk(sectionKey) {
    const content = document.getElementById('field-bulk').value.trim();
    if (!content) {
      App.toast('Please enter your markdown content', 'error');
      return;
    }
    App.addBulk(sectionKey, {
      rollNo: Auth.getUser(),
      markdownContent: content,
    });
    App.closeModal();
    App.toast('Full solution uploaded! +25 pts', 'success');
    App.route();
  }

  /* ===== DELETE ===== */
  function deleteSubmission(sectionKey, id) {
    if (!confirm('Delete this submission?')) return;
    App.deleteSubmission(sectionKey, id);
    App.toast('Submission deleted', 'info');
    App.route();
  }

  function deleteBulkEntry(sectionKey, id) {
    if (!confirm('Delete this entry?')) return;
    App.deleteBulk(sectionKey, id);
    App.toast('Entry deleted', 'info');
    App.route();
  }

  /* ===== HELPERS ===== */
  function countSectionSubmissions(type, id, qCount) {
    let total = 0;
    for (let q = 1; q <= qCount; q++) {
      total += App.getSubmissionCount(`${type}-${id}-q-${q}`);
    }
    return total;
  }

  function emptyState(msg) {
    return `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg></div><p>${msg}</p></div>`;
  }

  /* ===== LEADERBOARD PAGE (delegates) ===== */
  function renderLeaderboard(container) {
    Leaderboard.render(container);
  }

  return {
    renderHome, renderGAList, renderQuestions, renderFeed, renderLeaderboard,
    openSubmissionModal, submitAnswer, openBulkModal, submitBulk,
    toggleBulkPreview, deleteSubmission, deleteBulkEntry,
  };
})();
