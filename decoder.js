(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const input       = document.getElementById("ref-input");
  const segEra      = document.getElementById("seg-era");
  const segModel    = document.getElementById("seg-model");
  const segBezel    = document.getElementById("seg-bezel");
  const segBracelet = document.getElementById("seg-bracelet");
  const segSuffix   = document.getElementById("seg-suffix");
  const resultCard  = document.getElementById("result-card");
  const segBoxes    = document.querySelectorAll(".seg-box");
  const placeholder = document.getElementById("decoder-placeholder");

  // ── Parse a raw input string into its logical parts ──────────────────────
  function parse(raw) {
    // Normalise: uppercase, strip spaces/dashes
    const clean = raw.replace(/[\s\-]/g, "").toUpperCase();

    // Suffix is any trailing alpha characters (after the last digit)
    const digitMatch  = clean.match(/^(\d+)/);
    const digits      = digitMatch ? digitMatch[1] : "";
    const suffix      = clean.slice(digits.length);

    return {
      era:      digits.slice(0, 2),
      modelKey: digits.slice(0, 6),           // full 6-digit model key
      modelSeg: digits.slice(2, 5),           // display segment (3 digits)
      bezelDig: digits[5] ?? "",
      bracDig:  digits[6] ?? "",
      suffix:   suffix,
      digits:   digits,
      full:     clean
    };
  }

  // ── Animate a single element in ───────────────────────────────────────────
  function animateIn(el, delay) {
    el.style.transition = "none";
    el.style.opacity    = "0";
    el.style.transform  = "scale(0.85)";
    el.classList.remove("hidden");

    // Force reflow
    void el.offsetWidth;

    el.style.transition = `opacity 350ms ease ${delay}ms, transform 350ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`;
    el.style.opacity    = "1";
    el.style.transform  = "scale(1)";
  }

  // ── Animate result card in ────────────────────────────────────────────────
  function animateCardIn(el, delay) {
    el.style.transition  = "none";
    el.style.opacity     = "0";
    el.style.transform   = "translateY(20px)";
    el.classList.remove("hidden");

    void el.offsetWidth;

    el.style.transition  = `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms`;
    el.style.opacity     = "1";
    el.style.transform   = "translateY(0)";
  }

  // ── Populate a segment box ────────────────────────────────────────────────
  function fillBox(el, value, decoded, found) {
    const valueEl   = el.querySelector(".seg-value");
    const decodedEl = el.querySelector(".seg-decoded");

    valueEl.textContent   = value  || "—";
    decodedEl.textContent = decoded || (found ? "" : "Unknown");

    el.classList.toggle("seg-unknown", !found && value !== "");
  }

  // ── Build the result card HTML ────────────────────────────────────────────
  function buildCard(parts, data) {
    const { eraData, modelData, bezelData, bracData, suffixData } = data;
    const { era, modelKey, bezelDig, bracDig, suffix, digits } = parts;

    const known = modelData || eraData || bezelData || bracData;
    if (!known && digits.length < 2) return null;

    // Partial decode banner
    const isPartial = !modelData && digits.length >= 2;

    let html = "";

    if (isPartial) {
      html += `<div class="card-partial-notice">
        ⚠ We don't have this reference on file yet — but here's what we can decode from the segments we recognise.
      </div>`;
    }

    // Header row
    const modelName = modelData?.name || "Unknown Model";
    const material  = modelData?.material || (isPartial ? "—" : "Unknown");
    const category  = modelData?.category || "";

    html += `<div class="card-header">
      <div class="card-title-block">
        <span class="card-ref">${parts.full}</span>
        <h2 class="card-model-name">${modelName}</h2>
        ${category ? `<span class="card-category">${category}</span>` : ""}
      </div>
    </div>`;

    // Detail grid
    html += `<div class="card-grid">`;

    // Material / case
    html += cardRow("Case Material", material);

    // Era
    if (eraData) {
      html += cardRow("Production Era", `${eraData.label} <span class="card-sub">${eraData.years}</span>`);
    }

    // Bezel
    if (bezelData) {
      html += cardRow("Bezel Type", `${bezelData.label}<br><span class="card-sub">${bezelData.description}</span>`);
    } else if (bezelDig !== "") {
      html += cardRow("Bezel Type", `<span class="unknown-inline">Digit "${bezelDig}" — not in database</span>`);
    }

    // Suffix ceramic bezel overlay
    if (suffixData) {
      html += cardRow("Ceramic Bezel Insert", `<span class="ceramic-dot" style="background:${suffixData.color}"></span>${suffixData.label}<br><span class="card-sub">${suffixData.description}</span>`);
    }

    // Bracelet
    if (bracData) {
      html += cardRow("Bracelet", `${bracData.label}<br><span class="card-sub">${bracData.description}</span>`);
    } else if (bracDig !== "") {
      html += cardRow("Bracelet", `<span class="unknown-inline">Digit "${bracDig}" — not in database</span>`);
    }

    html += `</div>`;

    // Why this matters
    if (modelData?.significance) {
      html += `<div class="card-significance">
        <span class="sig-label">Why this matters</span>
        <p>${modelData.significance}</p>
      </div>`;
    } else if (eraData?.note) {
      html += `<div class="card-significance">
        <span class="sig-label">Era note</span>
        <p>${eraData.note}</p>
      </div>`;
    }

    return html;
  }

  function cardRow(label, value) {
    return `<div class="card-row">
      <span class="card-row-label">${label}</span>
      <span class="card-row-value">${value}</span>
    </div>`;
  }

  // ── Main decode routine ────────────────────────────────────────────────────
  function decode(raw) {
    const parts = parse(raw);
    const { era, modelKey, modelSeg, bezelDig, bracDig, suffix, digits } = parts;

    // Lookups
    const eraData    = era      ? REF_DATA.era[era]           : null;
    const modelData  = modelKey ? REF_DATA.model[modelKey]    : null;
    const bezelData  = bezelDig ? REF_DATA.bezel[bezelDig]    : null;
    const bracData   = bracDig  ? REF_DATA.bracelet[bracDig]  : null;
    const suffixData = suffix   ? REF_DATA.suffix[suffix]     : null;

    // Show/hide placeholder
    if (digits.length === 0) {
      placeholder.classList.remove("hidden");
      segBoxes.forEach(b => b.classList.add("hidden"));
      resultCard.classList.add("hidden");
      return;
    }

    placeholder.classList.add("hidden");

    // ── Segment boxes ─────────────────────────────────────────────────────
    let delay = 0;
    const STAGGER = 150;

    // Era box
    if (digits.length >= 2) {
      fillBox(segEra, era, eraData?.label, !!eraData);
      animateIn(segEra, delay);
      delay += STAGGER;
    } else {
      segEra.classList.add("hidden");
    }

    // Model box (show partial value as user types)
    if (digits.length >= 3) {
      const displaySeg = digits.slice(2, 5).padEnd(3, "_");
      fillBox(segModel, displaySeg, modelData?.name || (digits.length >= 6 ? "Unknown Model" : "…"), !!modelData || digits.length < 6);
      animateIn(segModel, delay);
      delay += STAGGER;
    } else {
      segModel.classList.add("hidden");
    }

    // Bezel digit box
    if (digits.length >= 6) {
      fillBox(segBezel, bezelDig, bezelData?.label, !!bezelData);
      animateIn(segBezel, delay);
      delay += STAGGER;
    } else {
      segBezel.classList.add("hidden");
    }

    // Bracelet digit box
    if (digits.length >= 7) {
      fillBox(segBracelet, bracDig, bracData?.label, !!bracData);
      animateIn(segBracelet, delay);
      delay += STAGGER;
    } else {
      segBracelet.classList.add("hidden");
    }

    // Suffix box
    if (suffix) {
      fillBox(segSuffix, suffix, suffixData?.label, !!suffixData);
      animateIn(segSuffix, delay);
      delay += STAGGER;
    } else {
      segSuffix.classList.add("hidden");
    }

    // ── Result card ───────────────────────────────────────────────────────
    if (digits.length >= 6) {
      const cardHTML = buildCard(parts, { eraData, modelData, bezelData, bracData, suffixData });
      if (cardHTML) {
        resultCard.innerHTML = cardHTML;
        animateCardIn(resultCard, delay + 50);
      }
    } else {
      resultCard.classList.add("hidden");
    }
  }

  // ── Event listener ────────────────────────────────────────────────────────
  input.addEventListener("input", function () {
    decode(this.value.trim());
  });

  // Run on load if there's a pre-filled value
  if (input.value.trim()) decode(input.value.trim());
})();
