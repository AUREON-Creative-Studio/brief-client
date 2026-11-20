(() => {
  const form = document.getElementById("brief-form");
  const steps = [...document.querySelectorAll(".step")];
  const progress = document.getElementById("progress-fill");
  const percent = document.getElementById("progress-percent");
  const kicker = document.getElementById("step-kicker");
  const back = document.getElementById("back-button");
  const next = document.getElementById("next-button");
  const submit = document.getElementById("submit-button");
  const error = document.getElementById("form-error");
  const colorInputs = [1,2,3,4].map(n => document.getElementById(`color-${n}`));
  let current = 0;

  function updateProgress() {
    const value = Math.round(((current + 1) / steps.length) * 100);
    progress.style.width = `${value}%`;
    percent.textContent = `${value}% COMPLÉTÉ`;
    kicker.textContent = `ÉTAPE 0${current + 1} / 0${steps.length}`;
    back.disabled = current === 0;
    next.hidden = current === steps.length - 1;
    submit.hidden = current !== steps.length - 1;
    error.textContent = "";
  }

  function showStep(index) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === current);
      step.setAttribute("aria-hidden", i !== current ? "true" : "false");
    });
    updateProgress();
    document.querySelector(".form-panel").scrollIntoView({behavior:"smooth", block:"start"});
  }

  function validateCurrent() {
    if (current !== 0) return true;
    const required = [
      {el: document.getElementById("company"), label:"le nom de votre entreprise"},
      {el: document.getElementById("services"), label:"vos principaux services"},
      {el: document.getElementById("contact"), label:"vos coordonnées professionnelles"}
    ];
    for (const item of required) {
      if (!item.el.value.trim()) {
        error.textContent = `Merci de renseigner ${item.label}.`;
        item.el.focus();
        return false;
      }
    }
    if (!document.querySelector('input[name="Spécialité"]:checked')) {
      error.textContent = "Merci de sélectionner au moins une spécialité.";
      document.querySelector('input[name="Spécialité"]').focus();
      return false;
    }
    return true;
  }

  next.addEventListener("click", () => {
    if (validateCurrent()) showStep(current + 1);
  });
  back.addEventListener("click", () => showStep(current - 1));

  function validHex(value) { return /^#[0-9A-Fa-f]{6}$/.test(value); }
  function syncColor(input, value) {
    if (!validHex(value)) return false;
    input.value = value;
    const hex = document.querySelector(`[data-for="${input.id}"]`);
    if (hex) hex.value = value.toUpperCase();
    renderPalette();
    return true;
  }
  function renderPalette() {
    const swatches = document.getElementById("palette-swatches");
    swatches.innerHTML = "";
    colorInputs.forEach(input => {
      const swatch = document.createElement("span");
      swatch.style.background = input.value;
      swatches.appendChild(swatch);
    });
  }
  colorInputs.forEach(input => {
    input.addEventListener("input", () => {
      const hex = document.querySelector(`[data-for="${input.id}"]`);
      hex.value = input.value.toUpperCase();
      renderPalette();
    });
  });
  document.querySelectorAll(".hex-value").forEach(hex => {
    hex.addEventListener("change", () => {
      const target = document.getElementById(hex.dataset.for);
      if (!syncColor(target, hex.value.trim())) {
        hex.value = target.value.toUpperCase();
        error.textContent = "Code couleur invalide. Utilisez le format #RRGGBB, par exemple #C9A45C.";
      } else error.textContent = "";
    });
  });

  function collectAnswers() {
    const data = {};
    const fields = [...form.querySelectorAll("input[name], textarea[name]")];
    const grouped = new Map();

    fields.forEach(el => {
      if (el.type === "checkbox" || el.type === "radio") {
        if (!grouped.has(el.name)) grouped.set(el.name, []);
        if (el.checked) grouped.get(el.name).push(el.value);
      } else if (el.type === "color") {
        data[el.name] = el.value.toUpperCase();
      } else if (el.value.trim()) {
        data[el.name] = el.value.trim();
      }
    });

    grouped.forEach((values, name) => {
      if (values.length) data[name] = values.join(", ");
    });

    data["Palette choisie"] = colorInputs
      .map((el, i) => `Couleur ${i + 1}: ${el.value.toUpperCase()}`)
      .join(" | ");

    return data;
  }

  function showSubmissionSuccess() {
    steps.forEach(step => step.classList.remove("active"));
    const done = document.createElement("div");
    done.className = "success-screen";
    done.innerHTML = `
      <div class="success-symbol">✓</div>
      <div class="section-index">TRANSMISSION RÉUSSIE</div>
      <h2>Merci pour votre confiance<span class="heading-period">.</span></h2>
      <p class="section-description">Votre brief a bien été transmis à AUREON. Notre équipe reviendra vers vous prochainement pour échanger sur votre projet.</p>
    `;
    form.querySelector(".form-actions").before(done);
    form.querySelector(".form-actions").hidden = true;
    progress.style.width = "100%";
    percent.textContent = "100% COMPLÉTÉ";
    kicker.textContent = "MERCI POUR VOTRE PARTICIPATION";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    error.textContent = "";

    if (!window.AUREON_SUPABASE_URL || !window.AUREON_SUPABASE_ANON_KEY ||
        window.AUREON_SUPABASE_URL.includes("YOUR_PROJECT") ||
        window.AUREON_SUPABASE_ANON_KEY.includes("YOUR_PUBLISHABLE")) {
      error.textContent = "Le formulaire n'est pas encore connecté. Merci de contacter AUREON.";
      return;
    }

    const submitButton = document.getElementById("submit-button");
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours…";

    try {
      const client = window.supabase.createClient(
        window.AUREON_SUPABASE_URL,
        window.AUREON_SUPABASE_ANON_KEY
      );
      const answers = collectAnswers();
      const companyName = answers["Nom de l'entreprise"] || "Entreprise non renseignée";

      const { error: insertError } = await client
        .from("client_briefs")
        .insert({
          company_name: companyName,
          answers: answers
        });

      if (insertError) throw insertError;
      showSubmissionSuccess();
    } catch (err) {
      console.error("AUREON submission error:", err);
      error.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez. Si le problème persiste, contactez AUREON.";
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  });

  showStep(0);
  renderPalette();
})();