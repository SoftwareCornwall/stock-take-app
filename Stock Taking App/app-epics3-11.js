(() => {
  const STORAGE_KEYS = {
    auth: 'stocktake.auth',
    credentials: 'stocktake.credentials',
    sessions: 'stocktake.sessions',
    activeSessionId: 'stocktake.activeSessionId',
    subDepartments: 'stocktake.subDepartments',
    catalogue: 'stocktake.catalogue'
  };

  const DEFAULT_CREDENTIALS = {
    username: 'staff',
    password: 'stocktake'
  };

  const SUPER_DEPARTMENTS = ['Tech Cornwall', 'Agile on the Beach'];
  const CONDITIONS = ['New', 'Good', 'Fair', 'Damaged', 'Other'];
  const SESSION_VIEWS = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' }
  ];

  const DEFAULT_SUB_DEPARTMENTS = {
    'Tech Cornwall': ['Main Store', 'North Room'],
    'Agile on the Beach': ['Storage', 'Production']
  };

  const DEFAULT_CATALOGUE = [
    { id: 'cat-laptop', name: 'Laptop', category: 'Computing', serialTracked: true },
    { id: 'cat-monitor', name: 'Monitor', category: 'Display', serialTracked: false },
    { id: 'cat-router', name: 'Router', category: 'Networking', serialTracked: true },
    { id: 'cat-switch', name: 'Switch', category: 'Networking', serialTracked: true },
    { id: 'cat-cable-pack', name: 'Cable Pack', category: 'Accessories', serialTracked: false },
    { id: 'cat-projector', name: 'Projector', category: 'AV', serialTracked: true },
    { id: 'cat-microphone', name: 'Microphone', category: 'AV', serialTracked: true },
    { id: 'cat-charger-pack', name: 'Charger Pack', category: 'Accessories', serialTracked: false },
    { id: 'cat-tablet', name: 'Tablet', category: 'Computing', serialTracked: true },
    { id: 'cat-keyboard', name: 'Keyboard', category: 'Accessories', serialTracked: false }
  ];

  const app = document.getElementById('app');
  if (!app) {
    return;
  }

  if (!localStorage.getItem(STORAGE_KEYS.credentials)) {
    localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(DEFAULT_CREDENTIALS));
  }

  const state = {
    auth: loadJson(STORAGE_KEYS.auth, null),
    credentials: loadJson(STORAGE_KEYS.credentials, DEFAULT_CREDENTIALS),
    sessions: loadJson(STORAGE_KEYS.sessions, []),
    activeSessionId: localStorage.getItem(STORAGE_KEYS.activeSessionId) || null,
    subDepartments: normalizeSubDepartments(loadJson(STORAGE_KEYS.subDepartments, DEFAULT_SUB_DEPARTMENTS)),
    catalogue: normalizeCatalogue(loadJson(STORAGE_KEYS.catalogue, DEFAULT_CATALOGUE)),
    selectedSuperDepartment: SUPER_DEPARTMENTS[0],
    selectedSubDepartment: '',
    pendingSessionNote: '',
    pendingSubDepartmentName: '',
    searchQuery: '',
    sessionView: 'active',
    selectedItemId: null,
    draftItem: null,
    catalogueView: 'active',
    selectedCatalogueId: null,
    catalogueDraft: null,
    credentialsDraft: { ...loadJson(STORAGE_KEYS.credentials, DEFAULT_CREDENTIALS) },
    loginError: '',
    flashMessage: '',
    formError: ''
  };

  ensureSessionShape();
  bindEvents();
  window.addEventListener('storage', handleStorageChange);
  render();

  function bindEvents() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (form.id === 'login-form') {
        event.preventDefault();
        handleLogin(form);
        return;
      }

      if (form.id === 'create-session-form') {
        event.preventDefault();
        handleCreateSession(form);
        return;
      }

      if (form.id === 'add-sub-department-form') {
        event.preventDefault();
        handleAddSubDepartment(form);
      }
    });

    document.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.id === 'search-query' && target instanceof HTMLInputElement) {
        state.searchQuery = target.value;
        render();
        return;
      }

      if (target.id === 'session-note' && target instanceof HTMLTextAreaElement) {
        state.pendingSessionNote = target.value;
        return;
      }

      if (target.id === 'sub-department-name' && target instanceof HTMLInputElement) {
        state.pendingSubDepartmentName = target.value;
        return;
      }

      if (target.id === 'draft-serial-number' && target instanceof HTMLInputElement && state.draftItem) {
        state.draftItem.serialNumber = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'catalogue-name' && target instanceof HTMLInputElement && state.catalogueDraft) {
        state.catalogueDraft.name = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'catalogue-category' && target instanceof HTMLInputElement && state.catalogueDraft) {
        state.catalogueDraft.category = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'config-username' && target instanceof HTMLInputElement) {
        state.credentialsDraft.username = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'config-password' && target instanceof HTMLInputElement) {
        state.credentialsDraft.password = target.value;
        state.formError = '';
      }
    });

    document.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.id === 'draft-condition' && target instanceof HTMLSelectElement && state.draftItem) {
        state.draftItem.condition = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'selected-super-department' && target instanceof HTMLSelectElement) {
        setSelectedSuperDepartment(target.value);
        return;
      }

      if (target.id === 'catalogue-serial-tracked' && target instanceof HTMLSelectElement && state.catalogueDraft) {
        state.catalogueDraft.serialTracked = target.value === 'true';
        state.formError = '';
        return;
      }

      if (target.id === 'catalogue-archived' && target instanceof HTMLInputElement && state.catalogueDraft) {
        state.catalogueDraft.archived = target.checked;
        state.formError = '';
        return;
      }

      if (target.id === 'catalogue-view' && target instanceof HTMLSelectElement) {
        state.catalogueView = target.value === 'archived' ? 'archived' : 'active';
        state.selectedCatalogueId = null;
        state.catalogueDraft = null;
        render();
        return;
      }

      if (target.id === 'config-username' && target instanceof HTMLInputElement) {
        state.credentialsDraft.username = target.value;
        state.formError = '';
        return;
      }

      if (target.id === 'config-password' && target instanceof HTMLInputElement) {
        state.credentialsDraft.password = target.value;
        state.formError = '';
      }
    });

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
      if (!target) {
        return;
      }

      const action = target.getAttribute('data-action');
      const sessionId = target.getAttribute('data-session-id');
      const itemId = target.getAttribute('data-item-id');
      const department = target.getAttribute('data-department');
      const view = target.getAttribute('data-view');
      const subDepartment = target.getAttribute('data-subdepartment');
      const exportType = target.getAttribute('data-export-type');
      const catalogueItemId = target.getAttribute('data-catalogue-item-id');

      switch (action) {
        case 'logout':
          handleLogout();
          break;
        case 'select-department':
          if (department) {
            setSelectedSuperDepartment(department);
          }
          break;
        case 'select-subdepartment':
          if (subDepartment !== null) {
            state.selectedSubDepartment = subDepartment;
            render();
          }
          break;
        case 'create-session':
          document.getElementById('create-session-form')?.requestSubmit();
          break;
        case 'open-session':
          if (sessionId) {
            openSession(sessionId);
          }
          break;
        case 'complete-session':
          if (sessionId) {
            completeSession(sessionId);
          }
          break;
        case 'archive-session':
          if (sessionId) {
            archiveSession(sessionId);
          }
          break;
        case 'export-session':
          if (sessionId) {
            exportSessionCsv(sessionId);
          }
          break;
        case 'export-department':
          if (department && exportType) {
            exportDepartmentCsv(department, exportType);
          }
          break;
        case 'set-session-view':
          if (view) {
            state.sessionView = view;
            render();
          }
          break;
        case 'select-item':
          if (sessionId && itemId) {
            selectItem(sessionId, itemId);
          }
          break;
        case 'draft-minus':
          adjustDraftQuantity(-1);
          break;
        case 'draft-plus':
          adjustDraftQuantity(1);
          break;
        case 'save-item':
          saveDraftItem();
          break;
        case 'clear-selection':
          state.selectedItemId = null;
          state.draftItem = null;
          state.formError = '';
          render();
          break;
        case 'set-catalogue-view':
          if (view) {
            state.catalogueView = view === 'archived' ? 'archived' : 'active';
            state.selectedCatalogueId = null;
            state.catalogueDraft = null;
            render();
          }
          break;
        case 'new-catalogue-item':
          state.selectedCatalogueId = null;
          state.catalogueDraft = {
            id: null,
            name: '',
            category: '',
            serialTracked: false,
            archived: false
          };
          state.formError = '';
          render();
          break;
        case 'select-catalogue-item':
          if (catalogueItemId) {
            selectCatalogueItem(catalogueItemId);
          }
          break;
        case 'save-catalogue-item':
          saveCatalogueItem();
          break;
        case 'archive-catalogue-item':
          if (catalogueItemId) {
            setCatalogueArchived(catalogueItemId, true);
          }
          break;
        case 'restore-catalogue-item':
          if (catalogueItemId) {
            setCatalogueArchived(catalogueItemId, false);
          }
          break;
        case 'save-config':
          saveConfiguration();
          break;
        default:
          break;
      }
    });
  }

  function handleLogin(form) {
    const username = form.querySelector('#username')?.value.trim() || '';
    const password = form.querySelector('#password')?.value || '';

    if (username === state.credentials.username && password === state.credentials.password) {
      state.auth = {
        username,
        signedInAt: new Date().toISOString()
      };
      state.loginError = '';
      state.flashMessage = 'Signed in. Create or resume a session to continue.';
      persistAuth();
      render();
      return;
    }

    state.loginError = 'Invalid username or password.';
    state.flashMessage = '';
    render();
  }

  function handleLogout() {
    state.auth = null;
    state.activeSessionId = null;
    state.selectedItemId = null;
    state.draftItem = null;
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.activeSessionId);
    render();
  }

  function handleCreateSession(form) {
    const superDepartment = state.selectedSuperDepartment || SUPER_DEPARTMENTS[0];
    const subDepartment = form.querySelector('#selected-sub-department')?.value.trim() || state.selectedSubDepartment || '';
    const note = form.querySelector('#session-note')?.value.trim() || '';

    if (!superDepartment) {
      state.formError = 'Select a super department first.';
      render();
      return;
    }

    const session = createSession(superDepartment, subDepartment, note);
    state.sessions = [session, ...state.sessions];
    persistSessions();
    openSession(session.id);
    state.pendingSessionNote = '';
    state.formError = '';
    render();
  }

  function handleAddSubDepartment(form) {
    const input = form.querySelector('#sub-department-name');
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const value = input.value.trim();
    if (!value) {
      state.formError = 'Enter a sub department name before adding it.';
      render();
      return;
    }

    const department = state.selectedSuperDepartment || SUPER_DEPARTMENTS[0];
    const list = state.subDepartments[department] || [];
    if (!list.includes(value)) {
      list.push(value);
      state.subDepartments = {
        ...state.subDepartments,
        [department]: list
      };
      persistSubDepartments();
    }

    state.selectedSubDepartment = value;
    state.pendingSubDepartmentName = '';
    state.formError = '';
    render();
  }

  function createSession(superDepartment, subDepartment, note) {
    const now = new Date();
    const createdAt = now.toISOString();
    const baseName = `Stock Take ${formatDate(now)}`;
    const similarCount = state.sessions.filter((session) => session.name.startsWith(baseName)).length;
    const name = similarCount === 0 ? baseName : `${baseName} ${similarCount + 1}`;

    return {
      id: newId(),
      name,
      createdAt,
      updatedAt: createdAt,
      status: 'Active',
      superDepartment,
      subDepartment,
      note,
      items: state.catalogue.filter((catalogueItem) => !catalogueItem.archived).map((catalogueItem) => ({
        id: newId(),
        catalogueId: catalogueItem.id,
        name: catalogueItem.name,
        category: catalogueItem.category,
        serialTracked: catalogueItem.serialTracked,
        quantity: 0,
        condition: 'New',
        serialNumber: ''
      }))
    };
  }

  function openSession(sessionId) {
    const session = findSession(sessionId);
    if (!session) {
      return;
    }

    state.activeSessionId = session.id;
    state.selectedSuperDepartment = session.superDepartment || SUPER_DEPARTMENTS[0];
    state.selectedSubDepartment = session.subDepartment || '';
    state.selectedItemId = session.items[0]?.id || null;
    state.draftItem = session.items[0] ? buildDraft(session, session.items[0]) : null;
    state.sessionView = session.status === 'Archived' ? 'archived' : session.status === 'Completed' ? 'completed' : 'active';
    localStorage.setItem(STORAGE_KEYS.activeSessionId, session.id);
    render();
  }

  function completeSession(sessionId) {
    const session = findSession(sessionId);
    if (!session || session.status !== 'Active') {
      return;
    }

    const confirmed = window.confirm(`Complete ${session.name}? Completed sessions become read only.`);
    if (!confirmed) {
      return;
    }

    session.status = 'Completed';
    session.updatedAt = new Date().toISOString();
    persistSessions();
    state.flashMessage = `${session.name} is now completed.`;
    render();
  }

  function archiveSession(sessionId) {
    const session = findSession(sessionId);
    if (!session || session.status !== 'Completed') {
      return;
    }

    const confirmed = window.confirm(`Archive ${session.name}? Archived sessions are hidden from active lists.`);
    if (!confirmed) {
      return;
    }

    session.status = 'Archived';
    session.updatedAt = new Date().toISOString();
    persistSessions();
    state.flashMessage = `${session.name} has been archived.`;
    if (state.activeSessionId === session.id) {
      state.activeSessionId = null;
      localStorage.removeItem(STORAGE_KEYS.activeSessionId);
    }
    render();
  }

  function selectItem(sessionId, itemId) {
    const session = findSession(sessionId);
    if (!session) {
      return;
    }

    const item = session.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    state.activeSessionId = session.id;
    state.selectedItemId = item.id;
    state.draftItem = buildDraft(session, item);
    state.formError = '';
    localStorage.setItem(STORAGE_KEYS.activeSessionId, session.id);
    render();
  }

  function buildDraft(session, item) {
    return {
      sessionId: session.id,
      itemId: item.id,
      quantity: item.serialTracked ? 1 : item.quantity,
      condition: item.condition || 'New',
      serialNumber: item.serialNumber || '',
      serialTracked: Boolean(item.serialTracked)
    };
  }

  function adjustDraftQuantity(delta) {
    if (!state.draftItem) {
      return;
    }

    const nextQuantity = state.draftItem.quantity + delta;
    if (state.draftItem.serialTracked) {
      if (nextQuantity > 1) {
        state.formError = 'Serial tracked items cannot have quantity greater than 1.';
        state.draftItem.quantity = 1;
        render();
        return;
      }

      if (nextQuantity < 1) {
        state.formError = 'Serial tracked items must stay at quantity 1.';
        state.draftItem.quantity = 1;
        render();
        return;
      }

      state.draftItem.quantity = 1;
      state.formError = '';
      render();
      return;
    }

    state.draftItem.quantity = Math.max(0, nextQuantity);
    state.formError = '';
    render();
  }

  function saveDraftItem() {
    if (!state.draftItem) {
      return;
    }

    const session = findSession(state.draftItem.sessionId);
    if (!session || session.status !== 'Active') {
      state.formError = 'Completed sessions are read only.';
      render();
      return;
    }

    const item = session.items.find((entry) => entry.id === state.draftItem.itemId);
    if (!item) {
      return;
    }

    const nextQuantity = state.draftItem.serialTracked ? 1 : Math.max(0, Number(state.draftItem.quantity) || 0);
    const nextSerialNumber = state.draftItem.serialTracked ? String(state.draftItem.serialNumber || '').trim() : '';

    if (state.draftItem.serialTracked && !nextSerialNumber) {
      state.formError = 'Serial tracked items require a serial number before saving.';
      render();
      return;
    }

    item.quantity = nextQuantity;
    item.condition = state.draftItem.condition || 'New';
    item.serialNumber = nextSerialNumber;
    session.updatedAt = new Date().toISOString();
    persistSessions();
    state.flashMessage = `${item.name} saved for ${session.name}.`;
    state.formError = '';
    state.draftItem = buildDraft(session, item);
    render();
  }

  function exportSessionCsv(sessionId) {
    const session = findSession(sessionId);
    if (!session) {
      return;
    }

    const rows = [['Sub Department', 'Item Name', 'Serial Number', 'Quantity', 'Condition']];
    session.items.forEach((item) => {
      rows.push([session.subDepartment || '', item.name, item.serialTracked ? item.serialNumber || '' : '', String(item.quantity), item.condition || '']);
    });

    const csv = rows
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    const fileName = `${slugify(session.superDepartment)}-${slugify(session.name)}.csv`;
    downloadText(fileName, csv);
    state.flashMessage = `Exported ${fileName}.`;
    render();
  }

  function exportDepartmentCsv(department, exportType) {
    const session = getLatestSessionForDepartment(department);
    if (!session) {
      state.formError = `No sessions found for ${department}.`;
      render();
      return;
    }

    const rows = [
      exportType === 'serial'
        ? ['Sub Department', 'Item Name', 'Serial Number', 'Quantity', 'Condition']
        : ['Sub Department', 'Item Name', 'Quantity', 'Condition']
    ];
    session.items.forEach((item) => {
      if (exportType === 'serial') {
        if (!item.serialTracked) {
          return;
        }
        rows.push([session.subDepartment || '', item.name, item.serialNumber || '', String(item.quantity), item.condition || '']);
        return;
      }

      if (item.serialTracked) {
        return;
      }

      rows.push([session.subDepartment || '', item.name, String(item.quantity), item.condition || '']);
    });

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const fileName = `${slugify(department)}-${exportType}.csv`;
    downloadText(fileName, csv);
    state.flashMessage = `Exported ${fileName}.`;
    state.formError = '';
    render();
  }

  function getLatestSessionForDepartment(department) {
    const sessions = state.sessions
      .filter((session) => session.superDepartment === department && session.status !== 'Archived')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return sessions[0] || null;
  }

  function setSelectedSuperDepartment(department) {
    state.selectedSuperDepartment = department;
    const subDepartments = state.subDepartments[department] || [];
    if (!subDepartments.includes(state.selectedSubDepartment)) {
      state.selectedSubDepartment = subDepartments[0] || '';
    }
    state.formError = '';
    render();
  }

  function normalizeSubDepartments(input) {
    const output = {};
    SUPER_DEPARTMENTS.forEach((department) => {
      const list = Array.isArray(input?.[department]) ? input[department].filter(Boolean) : [];
      output[department] = Array.from(new Set(list));
    });
    return output;
  }

  function normalizeCatalogue(input) {
    const list = Array.isArray(input) && input.length > 0 ? input : DEFAULT_CATALOGUE;
    return list.map((item, index) => ({
      id: item.id || `cat-${index + 1}`,
      name: item.name || 'Untitled item',
      category: item.category || 'General',
      serialTracked: Boolean(item.serialTracked),
      archived: Boolean(item.archived),
      updatedAt: item.updatedAt || null
    }));
  }

  function ensureSessionShape() {
    state.sessions = state.sessions.map((session) => ({
      id: session.id || newId(),
      name: session.name || `Stock Take ${formatDate(new Date(session.createdAt || Date.now()))}`,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
      status: normalizeStatus(session.status),
      superDepartment: SUPER_DEPARTMENTS.includes(session.superDepartment) ? session.superDepartment : SUPER_DEPARTMENTS[0],
      subDepartment: session.subDepartment || '',
      note: session.note || '',
      items: Array.isArray(session.items) && session.items.length > 0
        ? session.items.map((item, index) => ({
            id: item.id || newId(),
            catalogueId: item.catalogueId || state.catalogue[index]?.id || `cat-${index + 1}`,
            name: item.name || state.catalogue[index]?.name || 'Untitled item',
            category: item.category || state.catalogue[index]?.category || 'General',
            serialTracked: Boolean(item.serialTracked),
            quantity: Number(item.quantity) || 0,
            condition: CONDITIONS.includes(item.condition) ? item.condition : 'New',
            serialNumber: item.serialNumber || ''
          }))
        : state.catalogue.map((catalogueItem) => ({
            id: newId(),
            catalogueId: catalogueItem.id,
            name: catalogueItem.name,
            category: catalogueItem.category,
            serialTracked: catalogueItem.serialTracked,
            quantity: 0,
            condition: 'New',
            serialNumber: ''
          }))
    }));

    if (state.activeSessionId && !findSession(state.activeSessionId)) {
      state.activeSessionId = null;
      localStorage.removeItem(STORAGE_KEYS.activeSessionId);
    }

    persistSessions();
    persistSubDepartments();
    persistCatalogue();
  }

  function normalizeStatus(status) {
    return status === 'Completed' ? 'Completed' : status === 'Archived' ? 'Archived' : 'Active';
  }

  function render() {
    if (!state.auth) {
      app.innerHTML = renderLogin();
      return;
    }

    const activeSession = state.activeSessionId ? findSession(state.activeSessionId) : null;
    const selectedSession = activeSession || state.sessions.find((session) => session.status !== 'Archived') || null;
    const currentSession = selectedSession && state.activeSessionId === selectedSession.id ? selectedSession : activeSession;
    const sessionForBrowse = currentSession || selectedSession;
    const selectedItem = sessionForBrowse && state.draftItem
      ? sessionForBrowse.items.find((item) => item.id === state.draftItem.itemId) || null
      : null;

    const visibleSessions = state.sessions.filter((session) => {
      if (sessionViewMatches(session.status, state.sessionView)) {
        return true;
      }
      return false;
    });

    const currentDepartment = state.selectedSuperDepartment || SUPER_DEPARTMENTS[0];
    const currentSubDepartments = state.subDepartments[currentDepartment] || [];
    const activeCatalogueIds = new Set(state.catalogue.filter((item) => !item.archived).map((item) => item.id));
    const filteredItems = sessionForBrowse
      ? sessionForBrowse.items.filter((item) => {
          const query = state.searchQuery.trim().toLowerCase();
          if (!query) {
            return activeCatalogueIds.has(item.catalogueId) || !item.catalogueId;
          }
          return (activeCatalogueIds.has(item.catalogueId) || !item.catalogueId) && [item.name, item.category, item.condition, item.serialNumber || '']
            .join(' ')
            .toLowerCase()
            .includes(query);
        })
      : [];

    app.innerHTML = `
      <div class="app-frame">
        <section class="hero">
          <div class="hero-grid">
            <div>
              <div class="eyebrow">Stock Take Mobile Web App</div>
              <h1 class="title">Department-first stock taking for mobile use.</h1>
              <p class="subtitle">This build now covers Epics 3 to 8: departments, browseable catalogue, item counting and confirmation, serial tracking rules, department CSV export, and completed-session archiving. The workflow stays tap-first and low typing.</p>
            </div>
            <div class="hero-meta">
              <span class="pill"><strong>Signed in:</strong> ${escapeHtml(state.auth.username)}</span>
              <span class="pill"><strong>Selected department:</strong> ${escapeHtml(currentDepartment)}</span>
              <span class="pill"><strong>Open session:</strong> ${currentSession ? escapeHtml(currentSession.name) : 'None'}</span>
            </div>
          </div>
          ${state.flashMessage ? `<div class="success hero-message">${escapeHtml(state.flashMessage)}</div>` : ''}
          ${state.formError ? `<div class="error hero-message">${escapeHtml(state.formError)}</div>` : ''}
        </section>

        <div class="layout">
          <aside class="sidebar stack-section">
            ${renderDepartmentPanel(currentDepartment, currentSubDepartments)}
            ${renderSessionTabs()}
            ${renderSessionList(visibleSessions)}
          </aside>

          <main class="main stack-section">
            ${renderCurrentSessionPanel(sessionForBrowse)}
            ${renderCataloguePanel(sessionForBrowse, filteredItems)}
            ${renderItemDetailPanel(sessionForBrowse, selectedItem)}
            ${renderAdministrationPanel(sessionForBrowse)}
            ${renderConfigurationPanel()}
          </main>
        </div>
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
              <p class="card-subtitle">Use the shared staff credentials to reach the stock take workflow.</p>
            </div>
            <span class="badge info">Mobile-first</span>
          </div>

          ${state.loginError ? `<div class="error">${escapeHtml(state.loginError)}</div>` : ''}
          ${state.flashMessage ? `<div class="success">${escapeHtml(state.flashMessage)}</div>` : ''}

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
              <span class="hint">Shared credentials are configurable in-app.</span>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderDepartmentPanel(currentDepartment, currentSubDepartments) {
    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Departments</h2>
            <p class="panel-subtitle">Choose the super department first, then add or select a sub department.</p>
          </div>
          <button class="button danger" type="button" data-action="logout">Logout</button>
        </div>

        <div class="field">
          <label for="selected-super-department">Super department</label>
          <select id="selected-super-department" class="select">
            ${SUPER_DEPARTMENTS.map((department) => `<option value="${escapeHtml(department)}" ${department === currentDepartment ? 'selected' : ''}>${escapeHtml(department)}</option>`).join('')}
          </select>
        </div>

        <div class="chip-group">
          ${SUPER_DEPARTMENTS.map((department) => `
            <button class="chip ${department === currentDepartment ? 'active' : ''}" type="button" data-action="select-department" data-department="${escapeHtml(department)}">
              ${escapeHtml(department)}
            </button>
          `).join('')}
        </div>

        <form id="add-sub-department-form" class="stack stack-tight">
          <div class="field">
            <label for="sub-department-name">Add sub department</label>
            <input id="sub-department-name" class="input" type="text" value="${escapeHtml(state.pendingSubDepartmentName)}" placeholder="New sub department name" />
          </div>
          <div class="button-row">
            <button class="button secondary" type="submit">Add sub department</button>
            <button class="button secondary" type="button" data-action="select-subdepartment" data-subdepartment="">Clear</button>
          </div>
        </form>

        <div class="chip-group subdepartment-list">
          ${currentSubDepartments.length > 0 ? currentSubDepartments.map((subDepartment) => `
            <button class="chip ${subDepartment === state.selectedSubDepartment ? 'active' : ''}" type="button" data-action="select-subdepartment" data-subdepartment="${escapeHtml(subDepartment)}">
              ${escapeHtml(subDepartment)}
            </button>
          `).join('') : '<div class="empty-state">No sub departments yet.</div>'}
        </div>

        <form id="create-session-form" class="stack stack-tight">
          <div class="field">
            <label for="selected-sub-department">Session sub department (optional)</label>
            <input id="selected-sub-department" class="input" type="text" value="${escapeHtml(state.selectedSubDepartment)}" placeholder="Leave blank if not needed" />
          </div>
          <div class="field">
            <label for="session-note">Session note (optional)</label>
            <textarea id="session-note" class="textarea" rows="3" placeholder="Room, location or handover note">${escapeHtml(state.pendingSessionNote)}</textarea>
          </div>
          <button class="button primary" type="button" data-action="create-session">Create session</button>
        </form>

        <div class="export-grid">
          <button class="button secondary" type="button" data-action="export-department" data-department="${escapeHtml(currentDepartment)}" data-export-type="standard">Export standard CSV</button>
          <button class="button secondary" type="button" data-action="export-department" data-department="${escapeHtml(currentDepartment)}" data-export-type="serial">Export serial CSV</button>
        </div>
      </section>
    `;
  }

  function renderSessionTabs() {
    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Sessions</h2>
            <p class="panel-subtitle">Active sessions can be resumed; completed ones can be archived; archived sessions stay available for reporting.</p>
          </div>
        </div>
        <div class="button-row tabs-row">
          ${SESSION_VIEWS.map((view) => `<button class="tab ${state.sessionView === view.value ? 'active' : ''}" type="button" data-action="set-session-view" data-view="${view.value}">${view.label}</button>`).join('')}
        </div>
      </section>
    `;
  }

  function renderSessionList(sessions) {
    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Session list</h2>
            <p class="panel-subtitle">Tap a session to resume or review it.</p>
          </div>
        </div>
        <div class="session-list">
          ${sessions.length > 0 ? sessions.map((session) => renderSessionCard(session)).join('') : '<div class="empty-state">No sessions in this view yet.</div>'}
        </div>
      </section>
    `;
  }

  function renderSessionCard(session) {
    const totals = summarizeSession(session);
    const badgeClass = session.status === 'Completed' ? 'completed' : session.status === 'Archived' ? 'archived' : 'active';
    const primaryAction = session.status === 'Active' ? 'Resume session' : session.status === 'Completed' ? 'View session' : 'Open session';

    return `
      <article class="session-card ${session.id === state.activeSessionId ? 'active' : ''}">
        <div class="session-card-header">
          <div>
            <h3 class="session-name">${escapeHtml(session.name)}</h3>
            <p class="item-copy">${escapeHtml(session.superDepartment)}${session.subDepartment ? ` · ${escapeHtml(session.subDepartment)}` : ''}${session.note ? ` · ${escapeHtml(session.note)}` : ''}</p>
          </div>
          <span class="badge ${badgeClass}">${session.status}</span>
        </div>

        <div class="summary-grid">
          <div class="summary"><span class="label">Items</span><strong>${session.items.length}</strong></div>
          <div class="summary"><span class="label">Quantity</span><strong>${totals.quantity}</strong></div>
          <div class="summary"><span class="label">Serials</span><strong>${totals.serialItems}</strong></div>
        </div>

        <div class="button-row">
          <button class="button primary" type="button" data-action="open-session" data-session-id="${session.id}">${primaryAction}</button>
          <button class="button secondary" type="button" data-action="export-session" data-session-id="${session.id}">Export CSV</button>
          ${session.status === 'Active' ? `<button class="button warn" type="button" data-action="complete-session" data-session-id="${session.id}">Complete</button>` : ''}
          ${session.status === 'Completed' ? `<button class="button warn" type="button" data-action="archive-session" data-session-id="${session.id}">Archive</button>` : ''}
        </div>
      </article>
    `;
  }

  function renderCurrentSessionPanel(session) {
    if (!session) {
      return `
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Current session</h2>
              <p class="panel-subtitle">Create or resume a session to start browsing items.</p>
            </div>
          </div>
          <div class="empty-state">No session is open yet.</div>
        </section>
      `;
    }

    const readOnly = session.status !== 'Active';
    const totals = summarizeSession(session);

    return `
      <section class="panel detail-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Current session</h2>
            <p class="panel-subtitle">${escapeHtml(session.name)} · ${escapeHtml(session.superDepartment)}${session.subDepartment ? ` · ${escapeHtml(session.subDepartment)}` : ''}</p>
          </div>
          <span class="badge ${session.status === 'Completed' ? 'completed' : session.status === 'Archived' ? 'archived' : 'active'}">${session.status}</span>
        </div>

        <div class="summary-grid">
          <div class="summary"><span class="label">Started</span><strong>${formatDateTime(session.createdAt)}</strong></div>
          <div class="summary"><span class="label">Quantity</span><strong>${totals.quantity}</strong></div>
          <div class="summary"><span class="label">State</span><strong>${session.status}</strong></div>
        </div>

        <div class="button-row">
          <button class="button secondary" type="button" data-action="export-session" data-session-id="${session.id}">Export session CSV</button>
          ${session.status === 'Active' ? `<button class="button warn" type="button" data-action="complete-session" data-session-id="${session.id}">Complete session</button>` : ''}
          ${session.status === 'Completed' ? `<button class="button warn" type="button" data-action="archive-session" data-session-id="${session.id}">Archive session</button>` : ''}
        </div>

        ${readOnly ? '<div class="readonly-note">This session is read only.</div>' : '<div class="success">Tap an item below to update quantity, condition, or serial number, then confirm the change.</div>'}
      </section>
    `;
  }

  function renderCataloguePanel(session, items) {
    if (!session) {
      return `
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Catalogue</h2>
              <p class="panel-subtitle">Open a session to browse catalogue items.</p>
            </div>
          </div>
          <div class="empty-state">No session is selected.</div>
        </section>
      `;
    }

    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Catalogue</h2>
            <p class="panel-subtitle">Scrollable list first, search as a secondary helper. Tap any item to open its update view.</p>
          </div>
        </div>

        <div class="field">
          <label for="search-query">Search catalogue</label>
          <input id="search-query" class="input" type="search" placeholder="Search by name, category, condition, or serial number" value="${escapeHtml(state.searchQuery)}" />
        </div>

        <div class="catalog-scroll">
          <div class="catalog-list">
            ${items.length > 0 ? items.map((item) => renderCatalogueCard(session, item)).join('') : '<div class="empty-state">No catalogue items match your search.</div>'}
          </div>
        </div>
      </section>
    `;
  }

  function renderCatalogueCard(session, item) {
    const isSelected = state.selectedItemId === item.id;
    const itemStatus = describeItem(item);

    return `
      <button class="catalog-card ${isSelected ? 'active' : ''}" type="button" data-action="select-item" data-session-id="${session.id}" data-item-id="${item.id}">
        <div class="catalog-card-head">
          <div>
            <h3 class="catalog-card-title">${escapeHtml(item.name)}</h3>
            <p class="catalog-card-copy">${escapeHtml(item.category)}</p>
          </div>
          <span class="badge ${item.serialTracked ? 'info' : 'active'}">${item.serialTracked ? 'Serial' : 'Standard'}</span>
        </div>

        <div class="catalog-stats">
          <div><span class="label">Qty</span><strong>${item.quantity}</strong></div>
          <div><span class="label">Condition</span><strong>${escapeHtml(item.condition || 'New')}</strong></div>
          <div><span class="label">Status</span><strong>${escapeHtml(itemStatus)}</strong></div>
        </div>
      </button>
    `;
  }

  function renderItemDetailPanel(session, item) {
    if (!session) {
      return `
        <section class="panel detail-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Item detail</h2>
              <p class="panel-subtitle">Select a session first.</p>
            </div>
          </div>
          <div class="empty-state">No item is selected.</div>
        </section>
      `;
    }

    if (!item || !state.draftItem || state.draftItem.itemId !== item.id) {
      return `
        <section class="panel detail-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Item detail</h2>
              <p class="panel-subtitle">Tap an item in the catalogue to open the update screen.</p>
            </div>
            <button class="button secondary" type="button" data-action="clear-selection">Clear</button>
          </div>
          <div class="empty-state">No item is selected.</div>
        </section>
      `;
    }

    const readOnly = session.status !== 'Active';
    const serialWarning = state.draftItem.serialTracked
      ? 'Serial tracked items must keep quantity at 1 and require a serial number.'
      : 'Known items can be updated with taps and a confirm button.';

    return `
      <section class="panel detail-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Item detail</h2>
            <p class="panel-subtitle">${escapeHtml(item.name)} · ${escapeHtml(item.category)}</p>
          </div>
          <button class="button secondary" type="button" data-action="clear-selection">Clear</button>
        </div>

        <div class="detail-top">
          <div class="detail-quantity">
            <span class="label">Current quantity</span>
            <strong>${item.quantity}</strong>
          </div>
          <div class="detail-quantity">
            <span class="label">Current condition</span>
            <strong>${escapeHtml(item.condition || 'New')}</strong>
          </div>
          <div class="detail-quantity">
            <span class="label">Serial</span>
            <strong>${item.serialTracked ? (item.serialNumber || 'Required') : 'Not tracked'}</strong>
          </div>
        </div>

        <div class="item-status-line">${escapeHtml(serialWarning)}</div>

        <div class="draft-grid">
          <div class="draft-stepper">
            <button class="button secondary" type="button" data-action="draft-minus" ${readOnly ? 'disabled' : ''}>−</button>
            <span class="draft-count">${state.draftItem.quantity}</span>
            <button class="button secondary" type="button" data-action="draft-plus" ${readOnly ? 'disabled' : ''}>+</button>
          </div>

          <div class="field">
            <label for="draft-condition">Condition</label>
            <select id="draft-condition" class="select" ${readOnly ? 'disabled' : ''}>
              ${CONDITIONS.map((condition) => `<option value="${condition}" ${state.draftItem.condition === condition ? 'selected' : ''}>${condition}</option>`).join('')}
            </select>
          </div>

          ${state.draftItem.serialTracked ? `
            <div class="field">
              <label for="draft-serial-number">Serial number</label>
              <input id="draft-serial-number" class="input" type="text" value="${escapeHtml(state.draftItem.serialNumber || '')}" placeholder="Required for serial tracked items" ${readOnly ? 'disabled' : ''} />
            </div>
          ` : ''}
        </div>

        <div class="button-row">
          <button class="button primary" type="button" data-action="save-item" ${readOnly ? 'disabled' : ''}>Confirm update</button>
          ${session.status === 'Active' ? `<button class="button secondary" type="button" data-action="clear-selection">Cancel</button>` : ''}
        </div>
      </section>
    `;
  }

  function renderAdministrationPanel() {
    const catalogueItems = state.catalogue
      .filter((item) => state.catalogueView === 'archived' ? item.archived : !item.archived)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    const draft = state.catalogueDraft || {
      id: null,
      name: '',
      category: '',
      serialTracked: false,
      archived: false
    };

    const editingExisting = Boolean(draft.id);

    return `
      <section class="panel admin-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Catalogue administration</h2>
            <p class="panel-subtitle">Add, edit, and archive catalogue items. Archived items stay in history but are hidden from new stock takes.</p>
          </div>
        </div>

        <div class="field">
          <label for="catalogue-view">Catalogue view</label>
          <select id="catalogue-view" class="select">
            <option value="active" ${state.catalogueView === 'active' ? 'selected' : ''}>Active items</option>
            <option value="archived" ${state.catalogueView === 'archived' ? 'selected' : ''}>Archived items</option>
          </select>
        </div>

        <div class="button-row">
          <button class="button primary" type="button" data-action="new-catalogue-item">New catalogue item</button>
        </div>

        <div class="catalogue-admin-grid">
          <div class="catalogue-admin-list">
            ${catalogueItems.length > 0 ? catalogueItems.map((item) => renderCatalogueAdminCard(item)).join('') : '<div class="empty-state">No catalogue items in this view.</div>'}
          </div>

          <div class="catalogue-admin-form">
            <div class="card-header">
              <div>
                <h3 class="card-title">${editingExisting ? 'Edit catalogue item' : 'Create catalogue item'}</h3>
                <p class="card-subtitle">Required fields are name, category, and serial tracked.</p>
              </div>
            </div>

            <div class="stack">
              <div class="field">
                <label for="catalogue-name">Name</label>
                <input id="catalogue-name" class="input" type="text" value="${escapeHtml(draft.name || '')}" placeholder="Item name" />
              </div>

              <div class="field">
                <label for="catalogue-category">Category</label>
                <input id="catalogue-category" class="input" type="text" value="${escapeHtml(draft.category || '')}" placeholder="Item category" />
              </div>

              <div class="field">
                <label for="catalogue-serial-tracked">Serial tracked</label>
                <select id="catalogue-serial-tracked" class="select">
                  <option value="false" ${draft.serialTracked ? '' : 'selected'}>No</option>
                  <option value="true" ${draft.serialTracked ? 'selected' : ''}>Yes</option>
                </select>
              </div>

              <label class="toggle-row">
                <input id="catalogue-archived" type="checkbox" ${draft.archived ? 'checked' : ''} />
                <span>Archived</span>
              </label>

              <div class="button-row">
                <button class="button primary" type="button" data-action="save-catalogue-item">Save item</button>
                ${editingExisting && !draft.archived ? `<button class="button warn" type="button" data-action="archive-catalogue-item" data-catalogue-item-id="${draft.id}">Archive item</button>` : ''}
                ${editingExisting && draft.archived ? `<button class="button warn" type="button" data-action="restore-catalogue-item" data-catalogue-item-id="${draft.id}">Restore item</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderCatalogueAdminCard(item) {
    const isSelected = state.selectedCatalogueId === item.id;

    return `
      <article class="catalogue-admin-card ${isSelected ? 'active' : ''}">
        <button class="catalogue-admin-card-main" type="button" data-action="select-catalogue-item" data-catalogue-item-id="${item.id}">
          <div>
            <h3 class="catalogue-admin-title">${escapeHtml(item.name)}</h3>
            <p class="catalogue-admin-copy">${escapeHtml(item.category)}</p>
          </div>
          <span class="badge ${item.archived ? 'archived' : item.serialTracked ? 'info' : 'active'}">${item.archived ? 'Archived' : item.serialTracked ? 'Serial' : 'Standard'}</span>
        </button>
        <div class="button-row">
          <button class="button secondary" type="button" data-action="select-catalogue-item" data-catalogue-item-id="${item.id}">Edit</button>
          ${item.archived ? `<button class="button warn" type="button" data-action="restore-catalogue-item" data-catalogue-item-id="${item.id}">Restore</button>` : `<button class="button warn" type="button" data-action="archive-catalogue-item" data-catalogue-item-id="${item.id}">Archive</button>`}
        </div>
      </article>
    `;
  }

  function renderConfigurationPanel() {
    return `
      <section class="panel config-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Shared credentials</h2>
            <p class="panel-subtitle">Update the login username and password without changing code.</p>
          </div>
        </div>

        <div class="stack">
          <div class="field">
            <label for="config-username">Username</label>
            <input id="config-username" class="input" type="text" value="${escapeHtml(state.credentialsDraft.username || '')}" placeholder="Shared username" />
          </div>

          <div class="field">
            <label for="config-password">Password</label>
            <input id="config-password" class="input" type="text" value="${escapeHtml(state.credentialsDraft.password || '')}" placeholder="Shared password" />
          </div>

          <div class="button-row">
            <button class="button primary" type="button" data-action="save-config">Save credentials</button>
          </div>
        </div>
      </section>
    `;
  }

  function summarizeSession(session) {
    return session.items.reduce((accumulator, item) => {
      accumulator.quantity += Number(item.quantity) || 0;
      accumulator.serialItems += item.serialTracked ? 1 : 0;
      return accumulator;
    }, { quantity: 0, serialItems: 0 });
  }

  function describeItem(item) {
    if (item.serialTracked) {
      return item.serialNumber ? 'Saved' : 'Needs serial';
    }
    return item.quantity > 0 ? 'Saved' : 'Ready';
  }

  function sessionViewMatches(status, view) {
    if (view === 'active') {
      return status === 'Active';
    }
    if (view === 'completed') {
      return status === 'Completed';
    }
    return status === 'Archived';
  }

  function findSession(sessionId) {
    return state.sessions.find((session) => session.id === sessionId) || null;
  }

  function selectCatalogueItem(catalogueItemId) {
    const item = state.catalogue.find((entry) => entry.id === catalogueItemId);
    if (!item) {
      return;
    }

    state.selectedCatalogueId = item.id;
    state.catalogueDraft = {
      id: item.id,
      name: item.name,
      category: item.category,
      serialTracked: Boolean(item.serialTracked),
      archived: Boolean(item.archived)
    };
    state.formError = '';
    render();
  }

  function saveCatalogueItem() {
    if (!state.catalogueDraft) {
      state.catalogueDraft = {
        id: null,
        name: '',
        category: '',
        serialTracked: false,
        archived: false
      };
      render();
      return;
    }

    const name = String(state.catalogueDraft.name || '').trim();
    const category = String(state.catalogueDraft.category || '').trim();

    if (!name) {
      state.formError = 'Catalogue item name cannot be empty.';
      render();
      return;
    }

    if (!category) {
      state.formError = 'Catalogue item category cannot be empty.';
      render();
      return;
    }

    const record = {
      id: state.catalogueDraft.id || newId(),
      name,
      category,
      serialTracked: Boolean(state.catalogueDraft.serialTracked),
      archived: Boolean(state.catalogueDraft.archived),
      updatedAt: new Date().toISOString()
    };

    const index = state.catalogue.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      state.catalogue[index] = { ...state.catalogue[index], ...record };
    } else {
      state.catalogue = [record, ...state.catalogue];
    }

    persistCatalogue();
    syncCatalogueIntoOpenSessions(record);
    state.selectedCatalogueId = record.id;
    state.catalogueDraft = {
      id: record.id,
      name: record.name,
      category: record.category,
      serialTracked: record.serialTracked,
      archived: record.archived
    };
    state.flashMessage = `Saved ${record.name}.`;
    state.formError = '';
    render();
  }

  function setCatalogueArchived(catalogueItemId, archived) {
    const item = state.catalogue.find((entry) => entry.id === catalogueItemId);
    if (!item) {
      return;
    }

    item.archived = archived;
    item.updatedAt = new Date().toISOString();
    persistCatalogue();
    syncCatalogueIntoOpenSessions(item);
    if (state.selectedCatalogueId === item.id) {
      state.catalogueDraft = {
        id: item.id,
        name: item.name,
        category: item.category,
        serialTracked: Boolean(item.serialTracked),
        archived: Boolean(item.archived)
      };
    }
    state.flashMessage = archived ? `${item.name} archived.` : `${item.name} restored.`;
    render();
  }

  function saveConfiguration() {
    const username = String(state.credentialsDraft.username || '').trim();
    const password = String(state.credentialsDraft.password || '').trim();

    if (!username || !password) {
      state.formError = 'Shared credentials require both a username and a password.';
      render();
      return;
    }

    state.credentials = { username, password };
    state.credentialsDraft = { username, password };
    localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(state.credentials));
    state.flashMessage = 'Shared credentials updated.';
    state.formError = '';
    render();
  }

  function syncCatalogueIntoOpenSessions(catalogueItem) {
    state.sessions.forEach((session) => {
      session.items.forEach((item) => {
        if (item.catalogueId !== catalogueItem.id) {
          return;
        }

        item.name = catalogueItem.name;
        item.category = catalogueItem.category;
        item.serialTracked = Boolean(catalogueItem.serialTracked);
      });
      session.updatedAt = new Date().toISOString();
    });
    persistSessions();
  }

  function handleStorageChange(event) {
    if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key)) {
      return;
    }

    state.auth = loadJson(STORAGE_KEYS.auth, null);
    state.credentials = loadJson(STORAGE_KEYS.credentials, DEFAULT_CREDENTIALS);
    state.credentialsDraft = { ...state.credentials };
    state.sessions = loadJson(STORAGE_KEYS.sessions, []);
    state.activeSessionId = localStorage.getItem(STORAGE_KEYS.activeSessionId) || null;
    state.subDepartments = normalizeSubDepartments(loadJson(STORAGE_KEYS.subDepartments, DEFAULT_SUB_DEPARTMENTS));
    state.catalogue = normalizeCatalogue(loadJson(STORAGE_KEYS.catalogue, DEFAULT_CATALOGUE));
    ensureSessionShape();
    render();
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

  function persistAuth() {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state.auth));
  }

  function persistSessions() {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(state.sessions));
  }

  function persistSubDepartments() {
    localStorage.setItem(STORAGE_KEYS.subDepartments, JSON.stringify(state.subDepartments));
  }

  function persistCatalogue() {
    localStorage.setItem(STORAGE_KEYS.catalogue, JSON.stringify(state.catalogue));
  }

  function downloadText(fileName, contents) {
    const blob = new Blob(['\ufeff', contents], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function slugify(value) {
    return String(value || 'export')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function escapeCsv(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
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

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function normalizeSubDepartments(input) {
    const output = {};
    SUPER_DEPARTMENTS.forEach((department) => {
      const values = Array.isArray(input?.[department]) ? input[department] : [];
      output[department] = Array.from(new Set(values.filter(Boolean)));
    });
    return output;
  }

  function normalizeCatalogue(input) {
    const list = Array.isArray(input) && input.length > 0 ? input : DEFAULT_CATALOGUE;
    return list.map((item, index) => ({
      id: item.id || `cat-${index + 1}`,
      name: item.name || 'Untitled item',
      category: item.category || 'General',
      serialTracked: Boolean(item.serialTracked),
      archived: Boolean(item.archived),
      updatedAt: item.updatedAt || null
    }));
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  }
})();
