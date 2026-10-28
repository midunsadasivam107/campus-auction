/**
 * Handles room joining/leaving for live auctions
 */
const registerAuctionHandlers = (io, socket) => {
  // Join auction room
  socket.on('join-auction', (listingId) => {
    if (!listingId) return;
    const room = `auction:${listingId}`;
    socket.join(room);
    // console.log(`[Socket] ${socket.id} joined ${room}`);
  });

  // Leave auction room
  socket.on('leave-auction', (listingId) => {
    if (!listingId) return;
    const room = `auction:${listingId}`;
    socket.leave(room);
    // console.log(`[Socket] ${socket.id} left ${room}`);
  });
};

module.exports = {
  registerAuctionHandlers,
};
