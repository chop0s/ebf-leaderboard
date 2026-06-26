const REPO = 'chop0s/ebf-leaderboard';
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;

// Tab switching
function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`#tab-${name}`).classList.add('active');
    event.target.classList.add('active');
}

// Parse leaderboard CSV: steamid,mmr,plays,wins
function parseLeaderboard(text) {
    return text.trim().split('\n')
        .map(line => {
            const [steamid, mmr, plays, wins] = line.trim().split(',');
            if (!steamid) return null;
            return {
                steamid: steamid.trim(),
                mmr: parseInt(mmr) || 0,
                plays: parseInt(plays) || 0,
                wins: parseInt(wins) || 0,
            };
        })
        .filter(Boolean);
}

function renderRow(rank, player) {
    const losses = player.plays - player.wins;
    const wr = player.plays > 0 ? ((player.wins / player.plays) * 100).toFixed(1) : '0.0';
    const medal = rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank;
    return `<tr>
        <td>${medal}</td>
        <td><a href="https://steamcommunity.com/profiles/${player.steamid}" target="_blank" style="color:var(--text);text-decoration:none;">${player.steamid}</a></td>
        <td><strong>${player.mmr}</strong></td>
        <td>${player.plays}</td>
        <td style="color:#5cb85c">${player.wins}</td>
        <td style="color:#c0392b">${losses}</td>
        <td class="wr-cell">${wr}%</td>
    </tr>`;
}

async function loadLeaderboard() {
    try {
        const [r1, r2] = await Promise.all([
            fetch(`${RAW}/leaderboard/lb_1.txt`),
            fetch(`${RAW}/leaderboard/lb_2.txt`),
        ]);

        const [t1, t2] = await Promise.all([r1.text(), r2.text()]);

        const mmrData = parseLeaderboard(t1);
        const wrData = parseLeaderboard(t2);

        const mmrTbody = document.getElementById('mmr-tbody');
        const wrTbody = document.getElementById('wr-tbody');

        if (mmrData.length === 0) {
            mmrTbody.innerHTML = '<tr><td colspan="7" class="loading">No data yet — play some games!</td></tr>';
        } else {
            mmrTbody.innerHTML = mmrData.map((p, i) => renderRow(i + 1, p)).join('');
        }

        if (wrData.length === 0) {
            wrTbody.innerHTML = '<tr><td colspan="7" class="loading">No data yet — play some games!</td></tr>';
        } else {
            wrTbody.innerHTML = wrData.map((p, i) => renderRow(i + 1, p)).join('');
        }
    } catch (e) {
        document.getElementById('mmr-tbody').innerHTML = '<tr><td colspan="7" class="error">Failed to load leaderboard.</td></tr>';
        document.getElementById('wr-tbody').innerHTML = '<tr><td colspan="7" class="error">Failed to load leaderboard.</td></tr>';
    }
}

async function loadPatchNotes() {
    try {
        const r = await fetch(`${RAW}/patchnotes.md`);
        if (!r.ok) throw new Error();
        const text = await r.text();
        document.getElementById('patchnotes-content').innerHTML = marked.parse(text);
    } catch (e) {
        document.getElementById('patchnotes-content').innerHTML = '<p class="loading">Patch notes not found. Create patchnotes.md in the repo.</p>';
    }
}

// Nav highlight on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
});

loadLeaderboard();
loadPatchNotes();
