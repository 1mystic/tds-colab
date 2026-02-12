/* ===== ADMIN MODULE : Full CRUD ===== */
const Admin = (() => {

  /* --- SVG Icons (inline, minimalist) --- */
  const ICONS = {
    settings: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    plus: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    edit: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  };

  /* ============================================
     CONFIG MODAL : Overview of all GAs + Projects
     ============================================ */
  function openConfigModal() {
    if (!Auth.isAdmin()) return;
    const cfg = App.getConfig();

    // GA rows
    let gaRows = '';
    const gaIds = Object.keys(cfg.ga).sort((a, b) => a - b);
    gaIds.forEach(id => {
      const ga = cfg.ga[id];
      gaRows += `
            <div class="admin-row">
                <span class="admin-label">${ga.name}</span>
                <input type="number" id="cfg-ga-${id}" class="admin-input" value="${ga.questions}" min="0" placeholder="# Q" />
                <button class="btn btn-ghost btn-sm" onclick="Admin.openRenameModal('ga','${id}')" title="Rename">${ICONS.edit}</button>
                <button class="btn btn-danger btn-sm" onclick="Admin.deleteSection('ga','${id}')" title="Delete">${ICONS.trash}</button>
            </div>`;
    });

    // Project rows
    let projRows = '';
    const projIds = Object.keys(cfg.projects).sort((a, b) => a - b);
    projIds.forEach(id => {
      const p = cfg.projects[id];
      projRows += `
            <div class="admin-row">
                <span class="admin-label">${p.name}</span>
                <input type="number" id="cfg-proj-${id}" class="admin-input" value="${p.questions}" min="0" placeholder="# Q" />
                <button class="btn btn-ghost btn-sm" onclick="Admin.openRenameModal('project','${id}')" title="Rename">${ICONS.edit}</button>
                <button class="btn btn-danger btn-sm" onclick="Admin.deleteSection('project','${id}')" title="Delete">${ICONS.trash}</button>
            </div>`;
    });

    const html = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h3>Graded Assignments</h3>
                <button class="btn btn-ghost btn-sm" onclick="Admin.openAddModal('ga')">${ICONS.plus} Add GA</button>
            </div>
            ${gaRows || '<p style="color:var(--text-muted);font-size:13px;">No GAs configured.</p>'}
        </div>
        <div class="admin-section">
            <div class="admin-section-header">
                <h3>Projects</h3>
                <button class="btn btn-ghost btn-sm" onclick="Admin.openAddModal('project')">${ICONS.plus} Add Project</button>
            </div>
            ${projRows || '<p style="color:var(--text-muted);font-size:13px;">No projects configured.</p>'}
        </div>
        <div class="form-actions">
            <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Admin.saveConfig()">Save Changes</button>
        </div>`;

    App.openModal('Admin : Configuration', html);
  }

  /* --- Save all question counts from config modal --- */
  function saveConfig() {
    const cfg = App.getConfig();
    for (const id of Object.keys(cfg.ga)) {
      const el = document.getElementById(`cfg-ga-${id}`);
      if (el) cfg.ga[id].questions = parseInt(el.value) || 0;
    }
    for (const id of Object.keys(cfg.projects)) {
      const el = document.getElementById(`cfg-proj-${id}`);
      if (el) cfg.projects[id].questions = parseInt(el.value) || 0;
    }
    App.saveConfig(cfg);
    App.closeModal();
    App.toast('Configuration saved!', 'success');
    App.route();
  }

  /* ============================================
     ADD NEW GA / PROJECT
     ============================================ */
  function openAddModal(type) {
    const label = type === 'ga' ? 'Graded Assignment' : 'Project';
    const html = `
        <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" id="add-name" class="form-textarea" style="min-height:auto;padding:10px 14px;" 
                   placeholder="e.g. ${type === 'ga' ? 'GA 6' : 'Project 3'}" />
        </div>
        <div class="form-group">
            <label class="form-label">Number of Questions</label>
            <input type="number" id="add-questions" class="form-textarea" style="min-height:auto;padding:10px 14px;" 
                   value="0" min="0" placeholder="0" />
        </div>
        <div class="form-actions">
            <button class="btn btn-ghost" onclick="Admin.openConfigModal()">Back</button>
            <button class="btn btn-primary" onclick="Admin.addSection('${type}')">Add ${label}</button>
        </div>`;
    App.openModal(`Add ${label}`, html);
  }

  function addSection(type) {
    const cfg = App.getConfig();
    const name = document.getElementById('add-name').value.trim();
    const questions = parseInt(document.getElementById('add-questions').value) || 0;

    if (!name) {
      App.toast('Please enter a name', 'error');
      return;
    }

    const collection = type === 'ga' ? cfg.ga : cfg.projects;
    // Find next available ID
    const ids = Object.keys(collection).map(Number);
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

    collection[nextId] = { name, questions };

    App.saveConfig(cfg);
    App.closeModal();
    App.toast(`${name} added!`, 'success');
    App.route();
  }

  /* ============================================
     RENAME GA / PROJECT
     ============================================ */
  function openRenameModal(type, id) {
    const cfg = App.getConfig();
    const section = type === 'ga' ? cfg.ga[id] : cfg.projects[id];
    if (!section) return;

    const html = `
        <div class="form-group">
            <label class="form-label">New Name</label>
            <input type="text" id="rename-value" class="form-textarea" style="min-height:auto;padding:10px 14px;" 
                   value="${section.name}" />
        </div>
        <div class="form-actions">
            <button class="btn btn-ghost" onclick="Admin.openConfigModal()">Back</button>
            <button class="btn btn-primary" onclick="Admin.renameSection('${type}','${id}')">Rename</button>
        </div>`;
    App.openModal(`Rename : ${section.name}`, html);
  }

  function renameSection(type, id) {
    const cfg = App.getConfig();
    const newName = document.getElementById('rename-value').value.trim();
    if (!newName) {
      App.toast('Name cannot be empty', 'error');
      return;
    }
    if (type === 'ga') {
      cfg.ga[id].name = newName;
    } else {
      cfg.projects[id].name = newName;
    }
    App.saveConfig(cfg);
    App.toast(`Renamed to "${newName}"`, 'success');
    // Re-open config modal to show updated name
    openConfigModal();
  }

  /* ============================================
     DELETE GA / PROJECT
     ============================================ */
  function deleteSection(type, id) {
    const cfg = App.getConfig();
    const section = type === 'ga' ? cfg.ga[id] : cfg.projects[id];
    if (!section) return;

    if (!confirm(`Delete "${section.name}"? This will remove the section but won't delete existing submissions.`)) return;

    if (type === 'ga') {
      delete cfg.ga[id];
    } else {
      delete cfg.projects[id];
    }
    App.saveConfig(cfg);
    App.toast(`${section.name} deleted`, 'info');
    // Re-open config modal
    openConfigModal();
  }

  /* ============================================
     EDIT QUESTIONS (from inside a section page)
     ============================================ */
  function openEditQuestions(type, id) {
    if (!Auth.isAdmin()) return;
    const cfg = App.getConfig();
    const section = type === 'ga' ? cfg.ga[id] : cfg.projects[id];
    const label = type === 'ga' ? section.name : section.name;

    const html = `
        <div class="form-group">
            <label class="form-label">Number of Questions for ${label}</label>
            <input type="number" id="edit-q-count" class="form-textarea" 
                   style="min-height:auto;padding:10px 14px;"
                   value="${section.questions}" min="0" />
        </div>
        <div class="form-actions">
            <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="Admin.saveQuestionCount('${type}', '${id}')">Save</button>
        </div>`;

    App.openModal(`Edit ${label}`, html);
  }

  function saveQuestionCount(type, id) {
    const cfg = App.getConfig();
    const val = parseInt(document.getElementById('edit-q-count').value) || 0;
    if (type === 'ga') {
      cfg.ga[id].questions = val;
    } else {
      cfg.projects[id].questions = val;
    }
    App.saveConfig(cfg);
    App.closeModal();
    App.toast('Question count updated!', 'success');
    App.route();
  }

  return {
    openConfigModal, saveConfig,
    openAddModal, addSection,
    openRenameModal, renameSection,
    deleteSection,
    openEditQuestions, saveQuestionCount,
    ICONS,
  };
})();
