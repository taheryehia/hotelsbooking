'use strict';

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    // When Strapi publishes a document it creates a NEW published row but leaves the
    // superseded draft row behind. Delete that stale draft so each document keeps a
    // single row (published data only) and the site never shows duplicates.
    if (result?.documentId && result?.publishedAt) {
      await strapi.db.query('api::hotel.hotel').deleteMany({
        where: {
          documentId: result.documentId,
          publishedAt: { $null: true },
        },
      });
    }
  },
};
