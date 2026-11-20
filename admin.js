(() => {
  const loginPanel = document.getElementById("login-panel");
  const dashboardPanel = document.getElementById("dashboard-panel");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const dashboardError = document.getElementById("dashboard-error");
  const list = document.getElementById("brief-list");
  let client;

  function configReady() {
    return window.AUREON_SUPABASE_URL &&
      window.AUREON_SUPABASE_ANON_KEY &&
      !window.AUREON_SUPABASE_URL.includes("YOUR_PROJECT") &&
      !window.AUREON_SUPABASE_ANON_KEY.includes("YOUR_PUBLISHABLE");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[char]));
  }

  function displayDate(value) {
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle:"medium", timeStyle:"short"
    });
  }

  function exportBrief(brief) {
    const lines = [
      "AUREON — CLIENT BRIEF",
      "=====================",
      `Entreprise : ${brief.company_name}`,
      `Reçu le : ${displayDate(brief.created_at)}`,
      "",
      ...Object.entries(brief.answers || {}).flatMap(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(", ") : String(value),
        ""
      ])
    ];
    const blob = new Blob([lines.join("\n")], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `AUREON-brief-${String(brief.company_name).toLowerCase().replace(/[^a-z0-9]+/g,"-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function renderBriefs(briefs) {
    list.innerHTML = "";
    document.getElementById("brief-count").textContent = briefs.length;
    document.getElementById("last-updated").textContent = new Date().toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit"});

    if (!briefs.length) {
      list.innerHTML = '<div class="empty-state">Aucune réponse pour le moment. Les nouveaux briefs apparaîtront ici.</div>';
      return;
    }

    briefs.forEach((brief, index) => {
      const details = document.createElement("details");
      details.className = "brief-card";
      const answers = Object.entries(brief.answers || {});
      details.innerHTML = `
        <summary>
          <span class="brief-company">${escapeHtml(brief.company_name)}</span>
          <span class="brief-date">${escapeHtml(displayDate(brief.created_at))} · Brief #${brief.id}</span>
        </summary>
        <div class="brief-content">
          ${answers.map(([key, value]) => `
            <div class="answer-row">
              <strong>${escapeHtml(key)}</strong>
              <p>${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}</p>
            </div>`).join("")}
          <div class="brief-actions"><button class="export-button" type="button" data-export="${index}">Exporter le brief (.txt) ↓</button></div>
        </div>`;
      details.querySelector("[data-export]").addEventListener("click", () => exportBrief(brief));
      list.appendChild(details);
    });
  }

  async function loadBriefs() {
    dashboardError.textContent = "";
    list.innerHTML = '<div class="empty-state">Chargement des réponses…</div>';
    const {data, error} = await client
      .from("client_briefs")
      .select("id, company_name, answers, created_at")
      .order("created_at", {ascending:false});
    if (error) {
      dashboardError.textContent = "Impossible de charger les briefs. Vérifiez le compte administrateur et la politique RLS.";
      console.error(error);
      return;
    }
    renderBriefs(data || []);
  }

  async function showSession(session) {
    const loggedIn = Boolean(session);
    loginPanel.hidden = loggedIn;
    dashboardPanel.hidden = !loggedIn;
    if (loggedIn) await loadBriefs();
  }

  if (!configReady() || !window.supabase) {
    loginError.textContent = "Configurez d'abord supabase-config.js avec l'URL du projet et la clé publishable.";
    loginForm.querySelector("button").disabled = true;
    return;
  }

  client = window.supabase.createClient(window.AUREON_SUPABASE_URL, window.AUREON_SUPABASE_ANON_KEY);

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginError.textContent = "";
    const button = loginForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Connexion…";

    const {data, error} = await client.auth.signInWithPassword({
      email: document.getElementById("admin-email").value.trim(),
      password: document.getElementById("admin-password").value
    });

    button.disabled = false;
    button.innerHTML = 'Se connecter <span>→</span>';
    if (error) {
      loginError.textContent = "Identifiants incorrects ou connexion impossible.";
      return;
    }
    await showSession(data.session);
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    await client.auth.signOut();
    await showSession(null);
  });

  client.auth.getSession().then(({data}) => showSession(data.session));
  client.auth.onAuthStateChange((_event, session) => showSession(session));
})();