(function () {
  const STORAGE_KEYS = {
    auth: 'stocktake.auth',
    sessions: 'stocktake.sessions',
    credentials: 'stocktake.credentials',
    activeSessionId: 'stocktake.activeSessionId'
  };

  const DEFAULT_CREDENTIALS = {
    username: 'staff',
    password: 'stocktake'
  };

  const DEPARTMENTS = ['Tech Cornwall', 'Agile on the Beach'];

  const DEFAULT_ITEMS = [
    { name: 'Laptop', category: 'Computing', serialTracked: true },
    { name: 'Monitor', category: 'Display', serialTracked: false },
    { name: 'Router', category: 'Networking', serialTracked: true },
    { name: 'Cable Pack', category: 'Accessories', serialTracked: false },
    { name: 'Projector', category: 'AV', serialTracked: true }
  ];

  const app = document.getElementById('app');
  const state = {
    auth: loadJson(STORAGE_KEYS.auth, null),
    credentials: loadCredentials(),
    sessions: loadJson(STORAGE_KEYS.sessions, []),
    activeSessionId: localStorage.getItem(STORAGE_KEYS.activeSessionId) || null,
    loginError: '',
    loginMessage: '',
    pendingSuperDepartment: DEPARTMENTS[0],
    pendingSubDepartment: '',
    draftNote: '',
    activeView: 'active'
  };

  if (!localStorage.getItem(STORAGE_KEYS.credentials)) {
    localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(DEFAULT_CREDENTIALS));
  }

  ensureSessionShape();
  bindEvents();
  render();

  function bindEvents() {
    document.addEventListener('submit', function (event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (form.id === 'login-form') {
        event.preventDefault();
        handleLogin(form);
      }

      if (form.id === 'create-session-form') {
        event.preventDefault();
        handleCreateSession(form);
      }
    });

    document.addEventListener('click', function (event) {
      const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
      if (!target) {
        return;
      }

      const action = target.getAttribute('data-action');
      const sessionId = target.getAttribute('data-session-id');
      const itemId = target.getAttribute('data-item-id');

      if (action === 'logout') {
        handleLogout();
        return;
      }

      if (action === 'resume-session' && sessionId) {
        openSession(sessionId);
        return;
      }

      if (action === 'new-session') {
        document.getElementById('create-session-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (action === 'complete-session' && sessionId) {
        completeSession(sessionId);
        return;
      }

      if (action === 'export-session' && sessionId) {
        exportSession(sessionId);
        return;
      }

      if (action === 'increase-item' && sessionId && itemId) {
        adjustQuantity(sessionId, itemId, 1);
        return;
      }

      if (action === 'decrease-item' && sessionId && itemId) {
        adjustQuantity(sessionId, itemId, -1);
        return;
      }

      if (action === 'set-view') {
        state.activeView = target.getAttribute('data-view') || 'active';
        render();
      }
    });

    document.addEventListener('change', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) {
        return;
      }

      const sessionId = target.getAttribute('data-session-id');
      const itemId = target.getAttribute('data-item-id');

      if (target.id === 'pending-super-department') {
        state.pendingSuperDepartment = target.value;
        return;
      }

      if (target.id === 'pending-sub-department') {
        state.pendingSubDepartment = target.value;
        return;
      }

      if (target.id === 'draft-note') {
        state.draftNote = target.value;
        return;
      }

      if (target.matches('[data-field="condition"]') && sessionId && itemId) {
        updateItemField(sessionId, itemId, 'condition', target.value);
        return;
      }

      if (target.matches('[data-field="serial"]') && sessionId && itemId) {
        updateItemField(sessionId, itemId, 'serialNumber', target.value);
      }
    });

    document.addEventListener('input', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const sessionId = target.getAttribute('data-session-id');
      const itemId = target.getAttribute('data-item-id');

      if (target.matches('[data-field="serial"]') && sessionId && itemId) {
        updateItemField(sessionId, itemId, 'serialNumber', target.value, false);
      }
    });
  }

  function handleLogin(form) {
    const username = form.querySelector('#username')?.value.trim() || '';
    const password = form.querySelector('#password')?.value || '';
    const credentials = state.credentials;

    if (username === credentials.username && password === credentials.password) {
      state.auth = {
        username,
        signedInAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state.auth));
      state.loginError = '';
      state.loginMessage = 'Signed in. You can start or resume a session immediately.';
      render();
      return;
    }

    state.loginError = 'Invalid username or password.';
    state.loginMessage = '';
    render();
  }

  function handleLogout() {
    state.auth = null;
    state.activeSessionId = null;
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.activeSessionId);
    state.loginError = '';
    state.loginMessage = '';
    render();
  }

  function handleCreateSession(form) {
    const superDepartment = form.querySelector('#pending-super-department')?.value || DEPARTMENTS[0];
    const subDepartment = form.querySelector('#pending-sub-department')?.value.trim() || '';
    const note = form.querySelector('#draft-note')?.value.trim() || '';

    const session = createSession(superDepartment, subDepartment, note);
    state.sessions = [session, ...state.sessions];
    persistSessions();
    openSession(session.id);
    state.draftNote = '';
    render();
  }

  function createSession(superDepartment, subDepartment, note) {
    const now = new Date();
    const createdAt = now.toISOString();
    const baseName = `Stock Take ${formatDate(now)}`;
    const existingCount = state.sessions.filter((session) => session.name.startsWith(baseName)).length;
    const name = existingCount === 0 ? baseName : `${baseName} ${existingCount + 1}`;

    return {
      id: newId(),
      name,
      createdAt,
      updatedAt: createdAt,
      status: 'Active',
      superDepartment,
      subDepartment,
      note,
      items: DEFAULT_ITEMS.map((item) => ({
        id: newId(),
        name: item.name,
        category: item.category,
        serialTracked: item.serialTracked,
        quantity: 0,
        condition: 'New',
        serialNumber: ''
      }))
    };
  }

  function openSession(sessionId) {
    state.activeSessionId = sessionId;
    localStorage.setItem(STORAGE_KEYS.activeSessionId, sessionId);
    state.activeView = 'active';
    render();
  }

  function completeSession(sessionId) {
    const session = findSession(sessionId);
    if (!session || session.status === 'Completed') {
      return;
    }

    const confirmed = window.confirm(`Complete ${session.name}? Completed sessions become read only.`);
    if (!confirmed) {
      return;
    }

    session.status = 'Completed';
    session.updatedAt = new Date().toISOString();
    persistSessions();
    render();
  }

  function exportSession(sessionId) {
    const session = findSession(sessionId);
    if (!session) {
      return;
    }

    const rows = [
      ['Sub Department', 'Item Name', 'Serial Number', 'Quantity', 'Condition']
    ];

    session.items.forEach((item) => {
      rows.push([
        session.subDepartment || '',
        item.name,
        item.serialTracked ? item.serialNumber || '' : '',
        String(item.quantity),
        item.condition || ''
      ]);
    });

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function adjustQuantity(sessionId, itemId, delta) {
    const session = findSession(sessionId);
    if (!session || session.status === 'Completed') {
      return;
    }

    const item = session.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.quantity = Math.max(0, item.quantity + delta);
    item.updatedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    persistSessions();
    render();
  }

  function updateItemField(sessionId, itemId, field, value, shouldRender = true) {
    const session = findSession(sessionId);
    if (!session || session.status === 'Completed') {
      return;
    }

    const item = session.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    if (field === 'serialNumber' && !item.serialTracked) {
      return;
    }

    item[field] = value;
    item.updatedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    persistSessions();

    if (shouldRender) {
      render();
    }
  }

  function findSession(sessionId) {
    return state.sessions.find((session) => session.id === sessionId) || null;
  }

  function ensureSessionShape() {
    state.sessions = state.sessions.map((session) => ({
      id: session.id || newId(),
      name: session.name || `Stock Take ${formatDate(new Date(session.createdAt || Date.now()))}`,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
      status: session.status === 'Completed' ? 'Completed' : 'Active',
      superDepartment: session.superDepartment || DEPARTMENTS[0],
      subDepartment: session.subDepartment || '',
      note: session.note || '',
      items: Array.isArray(session.items)
        ? session.items.map((item) => ({
          id: item.id || newId(),
          name: item.name || 'Untitled item',
          category: item.category || 'General',
          serialTracked: Boolean(item.serialTracked),
          quantity: Number(item.quantity) || 0,
          condition: item.condition || 'New',
          serialNumber: item.serialNumber || ''
        }))
        : DEFAULT_ITEMS.map((item) => ({
          id: newId(),
          name: item.name,
          category: item.category,
          serialTracked: item.serialTracked,
          quantity: 0,
          condition: 'New',
          serialNumber: ''
        }))
    }));

    if (state.activeSessionId && !findSession(state.activeSessionId)) {
      state.activeSessionId = null;
      localStorage.removeItem(STORAGE_KEYS.activeSessionId);
    }

    persistSessions(false);
  }

  function persistSessions(shouldRender = false) {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(state.sessions));
    if (shouldRender) {
      render();
    }
  }

  function render() {
    if (!state.auth) {
      app.innerHTML = renderLogin();
      return;
    }

    const activeSession = state.activeSessionId ? findSession(state.activeSessionId) : null;
    const visibleSessions = state.activeView === 'completed'
      ? state.sessions.filter((session) => session.status === 'Completed')
      : state.sessions.filter((session) => session.status === 'Active');

    app.innerHTML = `
      <div class="frame">
        <section class="hero">
          <div class="hero-grid">
            <div>
              <div class="eyebrow">Stock Take Mobile Web App</div>
              <h1 class="title">Fast stock take on a phone, with minimal typing.</h1>
              <p class="subtitle">This first pass covers Epic 1 and Epic 2 from the handoff: shared login, active session creation, resume, and read-only completion. The session model already keeps room for later catalogue and export work.</p>
            </div>
            <div class="hero-meta">
              <span class="pill"><strong>Signed in:</strong> ${escapeHtml(state.auth.username)}</span>
              <span class="pill"><strong>Mode:</strong> mobile-first prototype</span>
              <span class="pill"><strong>Focus:</strong> Epics 1 and 2</span>
            </div>
          </div>
        </section>

        <div class="grid two">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Start a session</h2>
                <p class="panel-subtitle">Pick the super department, optionally add a sub department, then create the session. The new session starts active and all counts begin at 0.</p>
              </div>
              <button class="button secondary" type="button" data-action="new-session">Jump to form</button>
            </div>

            <form id="create-session-form" class="stack">
              <div class="field">
                <label for="pending-super-department">Super department</label>
                <select id="pending-super-department" class="select">
                  ${DEPARTMENTS.map((department) => `<option value="${escapeHtml(department)}" ${department === state.pendingSuperDepartment ? 'selected' : ''}>${escapeHtml(department)}</option>`).join('')}
                </select>
              </div>

              <div class="field">
                <label for="pending-sub-department">Sub department (optional)</label>
                <input id="pending-sub-department" class="input" type="text" placeholder="Add or pick a sub department" value="${escapeHtml(state.pendingSubDepartment)}" />
              </div>

              <div class="field">
                <label for="draft-note">Session note (optional)</label>
                <textarea id="draft-note" class="textarea" rows="3" placeholder="Useful for location, room, or team notes">${escapeHtml(state.draftNote)}</textarea>
              </div>

              <div class="login-footer">
                <button class="button primary" type="submit">Create session</button>
                <span class="hint">Auto names use today’s date so staff can get moving quickly.</span>
              </div>
            </form>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Current session</h2>
                <p class="panel-subtitle">Open an active session to update counts. Completed sessions stay visible but cannot be edited.</p>
              </div>
              <button class="button danger" type="button" data-action="logout">Logout</button>
            </div>

            ${activeSession ? renderSessionDetail(activeSession) : '<div class="empty-state">No session is open yet. Create one on the left or resume an active session below.</div>'}
          </section>
        </div>

        <section class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Sessions</h2>
              <p class="card-subtitle">Active sessions are quick to resume. Completed sessions remain read only and can still be exported.</p>
            </div>
            <div class="button-row">
              <button class="button ${state.activeView === 'active' ? 'primary' : 'secondary'}" type="button" data-action="set-view" data-view="active">Active</button>
              <button class="button ${state.activeView === 'completed' ? 'primary' : 'secondary'}" type="button" data-action="set-view" data-view="completed">Completed</button>
            </div>
          </div>

          <div class="session-list">
            ${visibleSessions.length > 0 ? visibleSessions.map((session) => renderSessionCard(session)).join('') : '<div class="empty-state">No sessions found for this view yet.</div>'}
          </div>
        </section>
      </div>
    `;
  }

  function renderLogin() {
    return `
      <div class="login-wrap">
        <section class="card login-card">
          <div class="card-header">
            <div>
              <div class="eyebrow">Shared login</div>
              <h1 class="card-title" style="font-size: 1.7rem; margin-top: 0.4rem;">Sign in to continue</h1>
              <p class="card-subtitle">Use the shared staff credentials to reach stock take sessions. This prototype stores data locally in the browser so the Epic 1 and 2 flow can be exercised immediately.</p>
            </div>
            <span class="badge info">Mobile-first</span>
          </div>

          ${state.loginError ? `<div class="error">${escapeHtml(state.loginError)}</div>` : ''}
          ${state.loginMessage ? `<div class="success">${escapeHtml(state.loginMessage)}</div>` : ''}

          <form id="login-form" class="stack">
            <div class="field">
              <label for="username">Username</label>
              <input id="username" class="input" name="username" autocomplete="username" inputmode="text" placeholder="staff" required />
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input id="password" class="input" name="password" type="password" autocomplete="current-password" placeholder="stocktake" required />
            </div>
            <div class="login-footer">
              <button class="button primary" type="submit">Sign in</button>
              <span class="hint">Demo credentials: staff / stocktake</span>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderSessionCard(session) {
    const totals = session.items.reduce((acc, item) => {
      acc.quantity += item.quantity;
      acc.serialTracked += item.serialTracked ? 1 : 0;
      acc.filledSerials += item.serialTracked && item.serialNumber ? 1 : 0;
      return acc;
    }, { quantity: 0, serialTracked: 0, filledSerials: 0 });

    return `
      <article class="session-card">
        <div class="session-card-header">
          <div>
            <h3 class="session-name">${escapeHtml(session.name)}</h3>
            <p class="item-copy">${escapeHtml(session.superDepartment)}${session.subDepartment ? ` · ${escapeHtml(session.subDepartment)}` : ''}${session.note ? ` · ${escapeHtml(session.note)}` : ''}</p>
          </div>
          <span class="badge ${session.status === 'Completed' ? 'completed' : 'active'}">${session.status}</span>
        </div>

        <div class="summary-grid">
          <div class="summary"><span class="label">Items</span><strong>${session.items.length}</strong></div>
          <div class="summary"><span class="label">Total quantity</span><strong>${totals.quantity}</strong></div>
          <div class="summary"><span class="label">Serials</span><strong>${totals.filledSerials}/${totals.serialTracked}</strong></div>
        </div>

        <div class="button-row">
          <button class="button primary" type="button" data-action="resume-session" data-session-id="${session.id}">${session.status === 'Completed' ? 'View session' : 'Resume session'}</button>
          <button class="button secondary" type="button" data-action="export-session" data-session-id="${session.id}">Export CSV</button>
          ${session.status === 'Active' ? `<button class="button warn" type="button" data-action="complete-session" data-session-id="${session.id}">Complete session</button>` : ''}
        </div>
      </article>
    `;
  }

  function renderSessionDetail(session) {
    const isCompleted = session.status === 'Completed';

    return `
      <div class="session-details">
        <div class="session-card-header">
          <div>
            <h3 class="session-name">${escapeHtml(session.name)}</h3>
            <p class="item-copy">${escapeHtml(session.superDepartment)}${session.subDepartment ? ` · ${escapeHtml(session.subDepartment)}` : ''} · ${formatDateTime(session.updatedAt)}</p>
          </div>
          <span class="badge ${isCompleted ? 'completed' : 'active'}">${session.status}</span>
        </div>

        ${isCompleted ? '<div class="readonly-note">This session is completed and read only. It can still be exported or reviewed.</div>' : '<div class="success">This session is active. Adjust counts, conditions, and serial numbers as you work.</div>'}

        <div class="button-row">
          <button class="button secondary" type="button" data-action="export-session" data-session-id="${session.id}">Export CSV</button>
          ${!isCompleted ? `<button class="button warn" type="button" data-action="complete-session" data-session-id="${session.id}">Complete Session</button>` : ''}
        </div>

        <div class="detail-grid">
          ${session.items.map((item) => renderItem(session, item, isCompleted)).join('')}
        </div>
      </div>
    `;
  }

  function renderItem(session, item, isCompleted) {
    return `
      <article class="item">
        <div class="item-head">
          <div>
            <h4 class="item-title">${escapeHtml(item.name)}</h4>
            <p class="item-copy">${escapeHtml(item.category)}${item.serialTracked ? ' · serial tracked' : ''}</p>
          </div>
          <span class="badge ${item.serialTracked ? 'info' : 'active'}">${item.serialTracked ? 'Serial tracked' : 'Standard'}</span>
        </div>

        <div class="item-controls">
          <div class="stepper">
            <button class="button secondary" type="button" data-action="decrease-item" data-session-id="${session.id}" data-item-id="${item.id}" ${isCompleted ? 'disabled' : ''}>−</button>
            <span class="count" aria-label="Quantity">${item.quantity}</span>
            <button class="button secondary" type="button" data-action="increase-item" data-session-id="${session.id}" data-item-id="${item.id}" ${isCompleted ? 'disabled' : ''}>+</button>
          </div>

          <div class="mini-grid">
            <div class="field">
              <label for="condition-${item.id}">Condition</label>
              <select id="condition-${item.id}" class="select" data-field="condition" data-session-id="${session.id}" data-item-id="${item.id}" ${isCompleted ? 'disabled' : ''}>
                ${['New', 'Good', 'Fair', 'Damaged', 'Other'].map((condition) => `<option value="${condition}" ${item.condition === condition ? 'selected' : ''}>${condition}</option>`).join('')}
              </select>
            </div>

            ${item.serialTracked ? `
              <div class="field">
                <label for="serial-${item.id}">Serial number</label>
                <input id="serial-${item.id}" class="input" data-field="serial" data-session-id="${session.id}" data-item-id="${item.id}" type="text" value="${escapeHtml(item.serialNumber || '')}" placeholder="Enter serial number" ${isCompleted ? 'disabled' : ''} />
              </div>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function loadCredentials() {
    return loadJson(STORAGE_KEYS.credentials, DEFAULT_CREDENTIALS);
  }

  function loadJson(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date).replace(/\s+/g, ' ');
  }

  function formatDateTime(isoValue) {
    const date = new Date(isoValue);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function escapeCsv(value) {
    const text = String(value ?? '');
    if (/[\",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  }
})();