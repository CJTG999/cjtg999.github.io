/*
  Change this if you ever want the homepage to point at a different GitHub account.
*/
const GITHUB_USER = "cjtg999";

const apiHeaders = {
  "Accept": "application/vnd.github+json"
};

const state = {
  projects: [],
  repos: 0
};

const $ = (id) => document.getElementById(id);

$("githubProfile").href = `https://github.com/${GITHUB_USER}`;
$("footerUser").textContent = GITHUB_USER;

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getAllRepos() {
  const repos = [];
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?per_page=100&page=${page}&sort=updated`,
      { headers: apiHeaders }
    );

    if (!response.ok) throw new Error(`GitHub repositories request failed (${response.status})`);

    const batch = await response.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

async function findPagesSite(repo) {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_USER)}/${encodeURIComponent(repo.name)}/pages`,
    { headers: apiHeaders }
  );

  if (response.status === 404) return null;
  if (!response.ok) return null;

  return await response.json();
}

async function loadProjects() {
  $("status").textContent = "Scanning your repositories for GitHub Pages sites…";

  try {
    const repos = await getAllRepos();
    state.repos = repos.length;

    // Check repositories in parallel, but keep the number reasonable.
    const pagesResults = await Promise.all(repos.map(async repo => {
      const pages = await findPagesSite(repo);
      return pages ? { repo, pages } : null;
    }));

    state.projects = pagesResults
      .filter(Boolean)
      .map(({ repo, pages }) => ({
        repo,
        pages,
        url: pages.html_url || `https://${GITHUB_USER}.github.io/${repo.name}`,
        status: pages.status || "unknown"
      }));

    $("repoCount").textContent = state.repos;
    $("projectCount").textContent = state.projects.length;
    $("lastUpdated").textContent = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    $("status").textContent =
      `${state.projects.length} GitHub Pages site${state.projects.length === 1 ? "" : "s"} found.`;

    render();
  } catch (error) {
    console.error(error);
    $("status").innerHTML =
      `<span style="color:var(--danger)">Could not load GitHub data.</span> ` +
      `Check the browser console or try refreshing.`;
    $("projects").innerHTML = `
      <div class="empty">
        GitHub's API could not be reached right now.<br>
        <small>This can also happen if the public API rate limit was reached.</small>
      </div>`;
  }
}

function render() {
  const query = $("search").value.trim().toLowerCase();
  const sort = $("sort").value;

  let projects = state.projects.filter(({ repo }) => {
    const haystack = [
      repo.name,
      repo.description,
      ...(repo.topics || []),
      repo.language
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });

  projects.sort((a, b) => {
    if (sort === "name") return a.repo.name.localeCompare(b.repo.name);
    if (sort === "stars") return b.repo.stargazers_count - a.repo.stargazers_count;
    return new Date(b.repo.updated_at) - new Date(a.repo.updated_at);
  });

  if (!projects.length) {
    $("projects").innerHTML = `<div class="empty">No matching projects found.</div>`;
    return;
  }

  $("projects").innerHTML = projects.map(({ repo, url, status }) => {
    const topics = (repo.topics || []).slice(0, 3)
      .map(t => `<span class="badge">${escapeHTML(t)}</span>`).join("");

    const language = repo.language
      ? `<span class="badge">${escapeHTML(repo.language)}</span>` : "";

    const stars = `<span class="badge">★ ${repo.stargazers_count}</span>`;
    const stateBadge = `<span class="badge">${escapeHTML(status)}</span>`;

    return `
      <article class="card">
        <div class="card-top">
          <div>
            <h2>${escapeHTML(repo.name.replaceAll("-", " "))}</h2>
            <div class="repo-name">${escapeHTML(repo.name)}</div>
          </div>
        </div>

        <p class="description">
          ${escapeHTML(repo.description || "No description has been added to this repository yet.")}
        </p>

        <div class="meta">
          ${language}${stars}${stateBadge}${topics}
        </div>

        <div class="actions">
          <a class="live" href="${escapeHTML(url)}" target="_blank" rel="noopener">LIVE SITE ↗</a>
          <a class="source" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener">SOURCE ↗</a>
        </div>
      </article>
    `;
  }).join("");
}

$("search").addEventListener("input", render);
$("sort").addEventListener("change", render);
$("refresh").addEventListener("click", loadProjects);

loadProjects();
