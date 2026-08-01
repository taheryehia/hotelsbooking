'use strict';

const HOTEL_UID = 'api::hotel.hotel';

/**
 * Auto-renumber `display_order` so it always stays contiguous (1..N) and the
 * edited hotel is placed at the position its new value requests.
 *
 * Example: X=1, Y=2. Setting Y to 1 moves Y to the front and shifts X to 2.
 * Works for any number of hotels, and keeps BOTH the draft and published rows
 * of every hotel in sync so the admin (drafts) and the site (published) agree.
 *
 * Safe from recursion: fix-up writes use `updateMany`, which fires the
 * `*Many` lifecycle events our hook does not implement.
 */

// Returns the display_order value from update data, or undefined if not set.
function getDisplayOrder(data) {
  const value = data?.display_order;
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// Reads the current value of the row being updated, to detect a real change.
async function capturePreviousDisplayOrder(event) {
  const { params, state } = event;
  const value = getDisplayOrder(params?.data);
  if (value === undefined) {
    return;
  }
  try {
    const row = await strapi.db.query(HOTEL_UID).findOne({
      where: params.where,
      select: ['display_order']
    });
    state.prevDisplayOrder = row?.display_order;
  } catch (error) {
    // Ignore read errors; afterUpdate will still renumber when it can.
  }
}

// Recompute the contiguous ordering with the edited document at `targetOrder`.
async function renumberHotels(editedRowId, targetOrder) {
  const rows = await strapi.db.query(HOTEL_UID).findMany({
    select: ['id', 'documentId', 'display_order'],
    orderBy: [{ display_order: 'asc' }, { id: 'asc' }]
  });
  if (!rows || rows.length === 0) {
    return;
  }

  // A document may have both a draft and a published row (with possibly
  // different display_order while one is newer). Group rows by documentId.
  const docs = [];
  const byDocumentId = new Map();
  const orderById = new Map();
  for (const row of rows) {
    orderById.set(row.id, row.display_order);
    let doc = byDocumentId.get(row.documentId);
    if (!doc) {
      doc = { documentId: row.documentId, ids: [] };
      byDocumentId.set(row.documentId, doc);
      docs.push(doc);
    }
    doc.ids.push(row.id);
  }

  // Locate the edited document.
  let editedIndex = -1;
  for (let i = 0; i < docs.length; i += 1) {
    if (docs[i].ids.includes(editedRowId)) {
      editedIndex = i;
      break;
    }
  }
  if (editedIndex === -1) {
    return;
  }

  // Remove the edited document, then insert it at the requested 1-based position.
  const [edited] = docs.splice(editedIndex, 1);
  const total = docs.length + 1;
  const position = Math.max(1, Math.min(Number(targetOrder), total));
  docs.splice(position - 1, 0, edited);

  // Renumber every row (both statuses) that does not already hold its new value.
  for (let i = 0; i < docs.length; i += 1) {
    const newOrder = i + 1;
    const idsToUpdate = docs[i].ids.filter((id) => orderById.get(id) !== newOrder);
    if (idsToUpdate.length === 0) {
      continue;
    }
    await strapi.db.query(HOTEL_UID).updateMany({
      where: { id: { $in: idsToUpdate } },
      data: { display_order: newOrder }
    });
  }
}

module.exports = {
  async beforeUpdate(event) {
    await capturePreviousDisplayOrder(event);
  },

  async afterUpdate(event) {
    const { params, result, state } = event;
    const newOrder = getDisplayOrder(params?.data);
    if (newOrder === undefined) {
      return;
    }
    // Only renumber when the value actually changed.
    if (state?.prevDisplayOrder !== undefined && Number(state.prevDisplayOrder) === newOrder) {
      return;
    }
    await renumberHotels(result?.id, newOrder);
  },

  async afterCreate(event) {
    const { params, result } = event;
    // Only renumber new drafts with an explicit (positive) order. A published
    // row is created by the publish flow, which copies the draft's already
    // renumbered order. A default 0 order means "unset" — leave others alone.
    const newOrder = getDisplayOrder(params?.data);
    if (result?.publishedAt || newOrder === undefined || newOrder <= 0) {
      return;
    }
    await renumberHotels(result?.id, newOrder);
  }
};
