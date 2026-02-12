/* ===== LEADERBOARD MODULE ===== */
const Leaderboard = (() => {
  const STORAGE_KEY = 'tds_leaderboard';

  function getData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }
  function setData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function addPoints(rollNo, pts, reason) {
    const data = getData();
    if (!data[rollNo]) {
      data[rollNo] = { points: 0, submissionCount: 0, lastActive: null };
    }
    data[rollNo].points += pts;
    data[rollNo].submissionCount += 1;
    data[rollNo].lastActive = new Date().toISOString();
    setData(data);
  }

  function getRanked() {
    const data = getData();
    return Object.entries(data)
      .map(([roll, info]) => ({ roll, ...info }))
      .sort((a, b) => b.points - a.points);
  }

  function resetLeaderboard() {
    if (confirm('Reset the entire leaderboard? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      App.toast('Leaderboard reset', 'info');
      App.route();
    }
  }

  function render(container) {
    const ranked = getRanked();
    const currentUser = Auth.getUser();

    // Podium (top 3)
    let podiumHtml = '';
    if (ranked.length >= 1) {
      const order = ranked.length >= 3 ? [1, 0, 2] : ranked.length >= 2 ? [1, 0] : [0];
      podiumHtml = '<div class="lb-podium">';
      order.forEach(idx => {
        if (idx >= ranked.length) return;
        const u = ranked[idx];
        const pos = idx + 1;
        const letters = u.roll.slice(0, 2).toUpperCase();
        podiumHtml += `
          <div class="podium-item podium-${pos}">
            <div class="podium-avatar">${letters}</div>
            <div class="podium-roll">${u.roll}</div>
            <div class="podium-points">${u.points} pts</div>
            <div class="podium-bar"></div>
          </div>`;
      });
      podiumHtml += '</div>';
    }

    // Table
    let tableHtml = '';
    if (ranked.length === 0) {
      tableHtml = '<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z"/></svg></div><p>No submissions yet. Start contributing to get on the leaderboard!</p></div>';
    } else {
      tableHtml = `
        <table class="leaderboard-table">
          <thead>
            <tr><th>#</th><th>Roll Number</th><th>Points</th><th>Submissions</th><th>Last Active</th></tr>
          </thead>
          <tbody>`;
      ranked.forEach((u, i) => {
        const pos = i + 1;
        const rankClass = pos <= 3 ? `rank-${pos}` : '';
        const isMe = u.roll === currentUser;
        tableHtml += `
            <tr class="${isMe ? 'lb-current-user' : ''}">
              <td class="rank ${rankClass}">${pos <= 3 ? ['🥇', '🥈', '🥉'][pos - 1] : pos}</td>
              <td class="roll-col">${u.roll}</td>
              <td class="points-col">${u.points}</td>
              <td>${u.submissionCount}</td>
              <td style="color:var(--text-muted);font-size:12px">${u.lastActive ? App.timeAgo(u.lastActive) : ':'}</td>
            </tr>`;
      });
      tableHtml += '</tbody></table>';
    }

    container.innerHTML = `
      <div class="page-header">
        <h2><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-3px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z"/></svg> Leaderboard</h2>
        <div class="page-actions">
          ${Auth.isAdmin() ? `<button class="btn btn-danger btn-sm" onclick="Leaderboard.resetLeaderboard()">Reset</button>` : ''}
        </div>
      </div>
      ${podiumHtml}
      ${tableHtml}
    `;
  }

  return { addPoints, getRanked, render, resetLeaderboard };
})();
