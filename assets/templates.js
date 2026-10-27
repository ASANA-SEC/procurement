// Starter templates for new sections. Once a section is created its columns live in the
// Google Sheet and are edited in the app (Customize), so changing this file only affects
// sections created afterwards. `target` on a link column names another template id; it is
// matched to the section created from that template.
(function () {
  'use strict';
  const o = (value, label, color, extra) => Object.assign({ value, label, color }, extra || {});
  const title = (label) => ({ key: 'title', label, type: 'text', required: true, system: true, onCard: true });

  const priority = () => ({ key: 'priority', label: 'Priority', type: 'select', onCard: true, options: [o('normal', 'Normal', 'gray'), o('high', 'High', 'amber'), o('urgent', 'Urgent', 'red')] });
  const category = () => ({ key: 'category', label: 'Category', type: 'select', onCard: true, options: [o('material', 'Material / Equipment', 'blue'), o('service', 'Service / Subcon', 'purple'), o('consumable', 'Consumables', 'gray')] });

  window.TEMPLATES = [
    {
      id: 'pr',
      name: 'Purchase Requisitions',
      blurb: 'Requests from projects and departments, from submission to approval and PO.',
      stageField: 'stage',
      fields: [
        title('Item / description'),
        { key: 'prNo', label: 'PR no.', type: 'text', required: true, onCard: true },
        { key: 'requester', label: 'Requested by', type: 'person', onCard: true },
        { key: 'costCentre', label: 'Project / cost centre', type: 'text', onCard: true },
        category(),
        { key: 'stage', label: 'Stage', type: 'select', options: [
          o('draft', 'Draft', 'gray'),
          o('submitted', 'Submitted', 'amber', { alertDays: 1 }),
          o('approved', 'Approved', 'blue', { alertDays: 2 }),
          o('rejected', 'Rejected', 'red', { done: true }),
          o('sourcing', 'Sourcing', 'purple', { alertDays: 5 }),
          o('po_issued', 'PO Issued', 'green', { done: true }),
          o('cancelled', 'Cancelled', 'gray', { done: true }),
        ] },
        priority(),
        { key: 'requiredDate', label: 'Required on site by', type: 'date', due: true, onCard: true },
        { key: 'estValue', label: 'Estimated value', type: 'currency', total: true, onCard: true },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'quotes',
      name: 'Supplier RFQ & Quotations',
      blurb: 'Enquiries to suppliers, quotation comparison and recommendation.',
      stageField: 'stage',
      fields: [
        title('Scope'),
        { key: 'rfqNo', label: 'Supplier RFQ no.', type: 'text', required: true, onCard: true },
        { key: 'pr', label: 'Purchase requisition', type: 'link', target: 'pr', onCard: true },
        { key: 'stage', label: 'Stage', type: 'select', options: [
          o('todo', 'To Do', 'gray', { alertDays: 1 }),
          o('sent', 'RFQ Sent', 'amber'),
          o('received', 'Quotes Received', 'blue', { alertDays: 2 }),
          o('evaluation', 'Evaluation', 'purple', { alertDays: 3 }),
          o('recommended', 'Recommended', 'teal', { alertDays: 2 }),
          o('approved', 'Approved', 'green', { done: true }),
          o('cancelled', 'Cancelled', 'gray', { done: true }),
        ] },
        { key: 'suppliers', label: 'Suppliers invited', type: 'text' },
        { key: 'quotesIn', label: 'Quotes received', type: 'number', onCard: true },
        { key: 'closingDate', label: 'Quote closing date', type: 'datetime', due: true, onCard: true },
        { key: 'lowestQuote', label: 'Lowest quote', type: 'currency', total: true },
        { key: 'selectedSupplier', label: 'Recommended supplier', type: 'text', onCard: true },
        { key: 'recommendedValue', label: 'Recommended value', type: 'currency', total: true, onCard: true },
        { key: 'notes', label: 'Comparison notes', type: 'longtext' },
      ],
    },
    {
      id: 'po',
      name: 'Purchase Orders',
      blurb: 'POs from approval to delivery, with supplier, value and delivery date.',
      stageField: 'stage',
      fields: [
        title('Description'),
        { key: 'poNo', label: 'PO no.', type: 'text', required: true, onCard: true },
        { key: 'supplier', label: 'Supplier', type: 'text', onCard: true },
        { key: 'pr', label: 'Purchase requisition', type: 'link', target: 'pr' },
        { key: 'costCentre', label: 'Project / cost centre', type: 'text' },
        { key: 'stage', label: 'Stage', type: 'select', options: [
          o('draft', 'Draft', 'gray'),
          o('pending', 'Pending Approval', 'amber', { alertDays: 2 }),
          o('issued', 'Issued', 'blue', { alertDays: 3 }),
          o('acknowledged', 'Acknowledged', 'teal'),
          o('partial', 'Partially Delivered', 'purple'),
          o('delivered', 'Delivered', 'green', { done: true }),
          o('closed', 'Closed', 'gray', { done: true }),
          o('cancelled', 'Cancelled', 'red', { done: true }),
        ] },
        { key: 'poValue', label: 'PO value', type: 'currency', total: true, onCard: true },
        { key: 'paymentTerms', label: 'Payment terms', type: 'select', options: [o('cod', 'COD', 'gray'), o('30d', '30 days', 'blue'), o('60d', '60 days', 'teal'), o('90d', '90 days', 'purple'), o('advance', 'Advance / deposit', 'amber')] },
        { key: 'issueDate', label: 'Issued on', type: 'date' },
        { key: 'deliveryDate', label: 'Delivery due', type: 'date', due: true, onCard: true },
        { key: 'grnNo', label: 'DO / GRN no.', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'invoices',
      name: 'Supplier Invoices & Payments',
      blurb: 'Supplier invoices from receipt and PO/GRN matching to payment.',
      stageField: 'status',
      fields: [
        title('Description'),
        { key: 'invoiceNo', label: 'Invoice no.', type: 'text', required: true, onCard: true },
        { key: 'supplier', label: 'Supplier', type: 'text', onCard: true },
        { key: 'po', label: 'Purchase order', type: 'link', target: 'po', onCard: true },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('received', 'Received', 'gray', { alertDays: 2 }),
          o('verified', 'Verified (PO / GRN matched)', 'blue', { alertDays: 3 }),
          o('approved', 'Approved for Payment', 'purple'),
          o('disputed', 'Disputed', 'red'),
          o('paid', 'Paid', 'green', { done: true }),
        ] },
        { key: 'invoiceDate', label: 'Invoice date', type: 'date' },
        { key: 'amount', label: 'Invoice amount', type: 'currency', total: true, onCard: true },
        { key: 'paidAmount', label: 'Paid', type: 'currency', total: true },
        { key: 'dueDate', label: 'Payment due', type: 'date', due: true, onCard: true },
        { key: 'paidDate', label: 'Paid on', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
    {
      id: 'suppliers',
      name: 'Supplier Register',
      blurb: 'Approved vendor list with category, rating and registration expiry.',
      stageField: 'status',
      fields: [
        title('Supplier name'),
        { key: 'regNo', label: 'Company reg. no.', type: 'text', onCard: true },
        category(),
        { key: 'contact', label: 'Contact person', type: 'text' },
        { key: 'phone', label: 'Phone / email', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: [
          o('evaluating', 'Under Evaluation', 'amber', { alertDays: 14 }),
          o('approved', 'Approved', 'green'),
          o('probation', 'On Probation', 'purple'),
          o('blacklisted', 'Blacklisted', 'red', { done: true }),
          o('inactive', 'Inactive', 'gray', { done: true }),
        ] },
        { key: 'rating', label: 'Performance rating', type: 'select', onCard: true, options: [o('a', 'A — Excellent', 'green'), o('b', 'B — Good', 'blue'), o('c', 'C — Fair', 'amber'), o('d', 'D — Poor', 'red')] },
        { key: 'expiryDate', label: 'Registration / licence expiry', type: 'date', due: true, onCard: true },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'notes', label: 'Notes', type: 'longtext' },
      ],
    },
  ];

  /** A new section's settings from a template, with link columns pointed at existing sections. */
  window.sectionFromTemplate = function (tpl, sections) {
    const fields = JSON.parse(JSON.stringify(tpl.fields)).map((f) => {
      if (f.type === 'link') {
        const t = sections.find((s) => s.template === f.target && !s.archived);
        f.target = t ? t.id : '';
      }
      return f;
    });
    return { name: tpl.name, template: tpl.id, fields, stageField: tpl.stageField };
  };
})();
