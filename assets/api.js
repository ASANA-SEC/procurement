// Data layer. Both backends answer the same actions through call(action, payload):
//   Remote — Google Apps Script web app (Sheets + Drive), used when API_URL is set
//   Demo   — this browser's localStorage with example data; runs the same rules (core.js)
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const DEMO_KEY = 'procurement_demo_v1';
  const DEMO_USER = 'procurement_demo_user';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* blocked */ } }

  function readBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () => reject(new Error('Could not read the file.'));
      r.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------ Remote

  const Remote = {
    mode: 'remote',
    token: null,

    async call(action, payload) {
      let res;
      try {
        res = await fetch(CFG.API_URL, {
          method: 'POST',
          // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, token: this.token, payload: payload || {} }),
        });
      } catch (e) {
        throw Object.assign(new Error('Cannot reach the server. Check your internet connection.'), { code: 'NETWORK' });
      }
      let out;
      try { out = await res.json(); } catch (e) {
        throw Object.assign(new Error('The server sent an unexpected reply. Check API_URL in config.js.'), { code: 'BAD_REPLY' });
      }
      if (!out.ok) throw Object.assign(new Error(out.error || 'Request failed'), { code: out.code });
      return out.data;
    },

    async upload(id, file) {
      return this.call('item.upload', { id, fileName: file.name, mimeType: file.type, base64: await readBase64(file) });
    },
  };

  // ------------------------------------------------------------ Demo

  function day(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const stamp = (offsetDays) => new Date(Date.now() + offsetDays * 864e5).toISOString();

  const DEMO_ACCOUNTS = {
    'sam.secov@gmail.com': 'Super admin — everything, including accounts, access and sections',
    'szesian.mitosc@gmail.com': 'Super admin',
    'eileen.secov@gmail.com': 'Super admin',
    'farah@example.com': 'Purchase Requisitions: Editor · Supplier RFQ & Quotations: Manager · Purchase Orders: Editor · Supplier Register: Manager',
    'ali@example.com': 'Purchase Requisitions: Contributor · Purchase Orders: Viewer',
    'siti@example.com': 'Supplier Invoices & Payments: Manager · Purchase Orders: Viewer',
    'kumar@example.com': 'Purchase Orders: Contributor (store — records deliveries)',
    'raj@example.com': 'No section access — sees only the requisitions he raised or follows',
  };

  function seed() {
    const SAM = 'sam.secov@gmail.com';
    const users = [
      ['sam.secov@gmail.com', 'Sam'], ['szesian.mitosc@gmail.com', 'Sze Sian'], ['eileen.secov@gmail.com', 'Eileen'], ['farah@example.com', 'Farah (Purchasing)'],
      ['ali@example.com', 'Ali (PM)'], ['siti@example.com', 'Siti (Finance)'], ['kumar@example.com', 'Kumar (Store)'], ['raj@example.com', 'Raj (Site)'],
    ].map(([id, name]) => ({ id, name, active: true, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) }));

    const ids = { pr: 's_pr', quotes: 's_quotes', po: 's_po', invoices: 's_invoices', suppliers: 's_suppliers' };
    const sections = window.TEMPLATES.map((t, i) => {
      const fields = clone(t.fields).map((f) => { if (f.type === 'link') f.target = ids[f.target] || ''; return f; });
      return { id: ids[t.id], name: t.name, template: t.id, order: i + 1, fields, stageField: t.stageField, archived: false, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) };
    });

    const access = [
      ['farah@example.com', 's_pr', 'editor'], ['farah@example.com', 's_quotes', 'manager'], ['farah@example.com', 's_po', 'editor'], ['farah@example.com', 's_suppliers', 'manager'],
      ['ali@example.com', 's_pr', 'contributor'], ['ali@example.com', 's_po', 'viewer'],
      ['siti@example.com', 's_invoices', 'manager'], ['siti@example.com', 's_po', 'viewer'],
      ['kumar@example.com', 's_po', 'contributor'],
    ].map(([userId, sectionId, level], i) => ({ id: 'a' + i, sectionId, userId, level, createdBy: SAM, createdAt: stamp(-60), updatedAt: stamp(-60) }));

    const item = (id, sectionId, title, data, editors, collaborators, ageDays) => ({
      id, sectionId, title, data, editors: editors || [], collaborators: collaborators || [], files: [],
      stageChangedAt: stamp(-(ageDays || 0)), createdBy: SAM, createdAt: stamp(-(ageDays || 0) - 2), updatedAt: stamp(-(ageDays || 0)),
    });
    const F = 'farah@example.com', A = 'ali@example.com', R = 'raj@example.com', T = 'siti@example.com', K = 'kumar@example.com';
    const pad = (n) => String(n).padStart(3, '0');

    const pr = (n, title, requester, costCentre, category, stage, priority, need, est, age, eds, cols) =>
      item('i_pr' + n, 's_pr', title, { prNo: 'PR-DEMO-' + pad(n), requester, costCentre, category, stage, priority, requiredDate: day(need), estValue: est, notes: '' }, eds || [requester, F], cols, age);
    const items = [
      pr(1, 'Mechanical seals and impeller for fire water pump', A, 'PRJ-DEMO-02 Fire water pump', 'material', 'po_issued', 'urgent', -2, 48000, 12),
      pr(2, 'Rockwool insulation and aluminium cladding sheets', A, 'PRJ-DEMO-01 Insulation repair', 'material', 'sourcing', 'high', 10, 126000, 3.5),
      pr(3, 'Scaffolding rental — 6 weeks', R, 'PRJ-DEMO-01 Insulation repair', 'service', 'approved', 'high', 7, 38000, 2.4, [R, F], [A]),
      pr(4, 'PPE replenishment (coveralls, gloves, safety glasses)', R, 'Site store', 'consumable', 'submitted', 'normal', 14, 6500, 1.8, [R, F]),
      pr(5, 'Calibration of pressure gauges (40 nos.)', A, 'PRJ-DEMO-02 Fire water pump', 'service', 'submitted', 'normal', 20, 9200, 0.4),
      pr(6, 'Control room console cables and glands', A, 'PRJ-DEMO-03 Control room', 'material', 'sourcing', 'urgent', 3, 54000, 6),
      pr(7, 'Portable gas detectors (5 units)', R, 'HSE', 'material', 'rejected', 'normal', 30, 21000, 4, [R, F]),
      pr(8, 'Office printer toner', F, 'Admin', 'consumable', 'draft', 'normal', 21, 1200, 0.2, [F]),
    ];

    const quote = (n, title, prId, stage, invited, quotesIn, close, lowest, supplier, value, age, notes) =>
      item('i_q' + n, 's_quotes', title, { rfqNo: 'SRFQ-DEMO-' + pad(n), pr: prId, stage, suppliers: invited, quotesIn, closingDate: day(close) + 'T17:00', lowestQuote: lowest, selectedSupplier: supplier, recommendedValue: value, notes: notes || '' }, [F], [], age);
    items.push(
      quote(1, 'Mechanical seals and impeller', 'i_pr1', 'approved', 'Supplier A, Supplier B, Supplier C (examples)', 3, -9, 44800, 'Supplier B (example)', 45600, 9, 'Supplier A cheapest but 8 weeks delivery; Supplier B 2 weeks.'),
      quote(2, 'Insulation and cladding materials', 'i_pr2', 'evaluation', 'Supplier C, Supplier D, Supplier E (examples)', 3, -1, 118500, '', 0, 3.5),
      quote(3, 'Scaffolding rental', 'i_pr3', 'sent', 'Supplier F, Supplier G (examples)', 0, 2, 0, '', 0, 1),
      quote(4, 'Console cables and glands', 'i_pr6', 'received', 'Supplier A, Supplier H (examples)', 2, -2, 51200, '', 0, 2.5),
      quote(5, 'Calibration service', 'i_pr5', 'todo', '', 0, 6, 0, '', 0, 0.3),
      quote(6, 'Cable tray and supports', '', 'recommended', 'Supplier D, Supplier H (examples)', 2, -4, 32400, 'Supplier H (example)', 32400, 2.6),
    );

    const po = (n, title, supplier, prId, costCentre, stage, value, terms, issued, due, grn, age, eds) =>
      item('i_po' + n, 's_po', title, { poNo: 'PO-DEMO-' + pad(n), supplier, pr: prId, costCentre, stage, poValue: value, paymentTerms: terms, issueDate: issued === null ? '' : day(issued), deliveryDate: day(due), grnNo: grn || '', notes: '' }, eds || [F], [K], age);
    items.push(
      po(1, 'Mechanical seals and impeller', 'Supplier B (example)', 'i_pr1', 'PRJ-DEMO-02 Fire water pump', 'issued', 45600, '30d', -8, -1, '', 8),
      po(2, 'Valves and fittings for pump skid', 'Supplier A (example)', '', 'PRJ-DEMO-02 Fire water pump', 'delivered', 28700, '30d', -40, -25, 'GRN-DEMO-0411', 20, [F, K]),
      po(3, 'Aluminium cladding — batch 1', 'Supplier D (example)', '', 'PRJ-DEMO-01 Insulation repair', 'partial', 86000, '60d', -30, -5, 'GRN-DEMO-0432 (part)', 5, [F, K]),
      po(4, 'Cable tray and supports', 'Supplier H (example)', '', 'PRJ-DEMO-03 Control room', 'pending', 32400, '30d', null, 12, '', 2.5),
      po(5, 'Safety signage', 'Supplier G (example)', '', 'HSE', 'acknowledged', 4800, 'cod', -6, 4, '', 4),
      po(6, 'Welding consumables', 'Supplier C (example)', '', 'Site store', 'closed', 9300, '30d', -70, -55, 'GRN-DEMO-0388', 50, [F, K]),
      po(7, 'Rental of 5-tonne lorry crane', 'Supplier F (example)', '', 'PRJ-DEMO-01 Insulation repair', 'draft', 15000, 'advance', null, 9, '', 0.5),
    );

    const inv = (n, title, invoiceNo, supplier, poId, status, invDate, amount, paid, due, paidDate, age) =>
      item('i_in' + n, 's_invoices', title, { invoiceNo, supplier, po: poId, status, invoiceDate: day(invDate), amount, paidAmount: paid, dueDate: day(due), paidDate: paidDate === null ? '' : day(paidDate), notes: '' }, [T], [F], age);
    items.push(
      inv(1, 'Valves and fittings', 'INV-A-20931', 'Supplier A (example)', 'i_po2', 'paid', -24, 28700, 28700, 6, -3, 3),
      inv(2, 'Aluminium cladding — batch 1 (partial)', 'INV-D-5521', 'Supplier D (example)', 'i_po3', 'verified', -4, 43000, 0, 56, null, 3.5),
      inv(3, 'Welding consumables', 'INV-C-7712', 'Supplier C (example)', 'i_po6', 'paid', -54, 9300, 9300, -24, -26, 26),
      inv(4, 'Safety signage — deposit', 'INV-G-118', 'Supplier G (example)', 'i_po5', 'approved', -5, 4800, 0, -1, null, 1),
      inv(5, 'Mechanical seals — advance invoice', 'INV-B-3390', 'Supplier B (example)', 'i_po1', 'received', -3, 45600, 0, 27, null, 3),
      inv(6, 'Cladding — price difference', 'INV-D-5498', 'Supplier D (example)', 'i_po3', 'disputed', -12, 2600, 0, 18, null, 8),
    );

    const sup = (n, title, regNo, category, contact, status, rating, expiry, age) =>
      item('i_s' + n, 's_suppliers', title, { regNo, category, contact, phone: '', status, rating, expiryDate: day(expiry), website: '', notes: '' }, [F], [], age);
    items.push(
      sup(1, 'Supplier A (example)', '201901000001', 'material', 'Mr Tan', 'approved', 'b', 210, 90),
      sup(2, 'Supplier B (example)', '201501000002', 'material', 'Ms Wong', 'approved', 'a', 25, 90),
      sup(3, 'Supplier C (example)', '200801000003', 'consumable', 'Mr Lee', 'approved', 'b', 330, 90),
      sup(4, 'Supplier D (example)', '201701000004', 'material', 'Mr Rahman', 'probation', 'c', 120, 30),
      sup(5, 'Supplier F (example)', '202101000005', 'service', 'Ms Kaur', 'evaluating', '', 365, 18),
      sup(6, 'Supplier H (example)', '201201000006', 'material', 'Mr Lim', 'approved', 'a', -5, 90),
    );
    return { users, sections, access, items, comments: [] };
  }

  function demoStore() {
    let db = null;
    function load() {
      if (db) return db;
      try { db = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { db = null; }
      if (!db || !Array.isArray(db.sections)) db = seed();
      ['users', 'sections', 'access', 'items', 'comments'].forEach((t) => { if (!Array.isArray(db[t])) db[t] = []; });
      persist();
      return db;
    }
    function persist() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch (e) { /* blocked */ } }
    const noDrive = () => Core.fail('DEMO', 'Attachments are saved to Google Drive. They start working after the Google setup in README.md.');
    return {
      all: (t) => clone(load()[t]),
      insert: (t, rec) => { load()[t].push(clone(rec)); persist(); },
      insertMany: (t, recs) => { load()[t].push(...clone(recs)); persist(); },
      save: (t, rec) => {
        const rows = load()[t];
        const i = rows.findIndex((r) => r.id === rec.id);
        if (i < 0) throw Core.fail('NOT_FOUND', 'This record no longer exists.');
        rows[i] = clone(rec);
        persist();
      },
      del: (t, id) => { db[t] = load()[t].filter((r) => r.id !== id); persist(); },
      delWhere: (t, fn) => { db[t] = load()[t].filter((r) => !fn(r)); persist(); },
      now: () => new Date().toISOString(),
      uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      saveFile: () => { throw noDrive(); },
      readFile: () => { throw noDrive(); },
      reset: () => { try { localStorage.removeItem(DEMO_KEY); } catch (e) { /* blocked */ } db = null; },
    };
  }

  const store = demoStore();

  const Demo = {
    mode: 'demo',
    me: null,

    restore() {
      const email = ssGet(DEMO_USER);
      if (!email) return false;
      try { this.me = Core.identify(store, email, ''); } catch (e) { this.me = null; ssSet(DEMO_USER, null); }
      return !!this.me;
    },
    login(email) {
      this.me = Core.identify(store, email, '');
      ssSet(DEMO_USER, email);
    },
    logout() { this.me = null; ssSet(DEMO_USER, null); },
    accounts() {
      return store.all('users').filter((u) => u.active !== false)
        .map((u) => ({ id: u.id, name: u.name, note: DEMO_ACCOUNTS[u.id] || 'Added in this demo' }));
    },
    async call(action, payload) {
      if (!this.me) throw Core.fail('AUTH_REQUIRED', 'Please sign in.');
      // Re-check the account each call, like the server does
      this.me = Core.identify(store, this.me.id, '');
      return clone(Core.handle(store, this.me, action, payload || {}));
    },
    async upload(id, file) {
      return this.call('item.upload', { id, fileName: file.name, mimeType: file.type, base64: '' });
    },
    reset() { store.reset(); this.logout(); },
  };

  // On this computer, http://localhost:8765/?demo forces demo mode for testing.
  // &reset starts from fresh example data; &as=<email> signs in as that example account (used to record the user guide).
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const params = new URLSearchParams(location.search);
  const forceDemo = local && params.has('demo');
  if (forceDemo && params.has('reset')) store.reset();
  if (forceDemo && params.get('as')) { try { Demo.login(params.get('as')); } catch (e) { /* unknown example account */ } }
  Demo.clean = forceDemo && params.has('clean'); // hide the demo banner for user-guide screenshots
  window.API = CFG.API_URL && !forceDemo ? Remote : Demo;
})();
