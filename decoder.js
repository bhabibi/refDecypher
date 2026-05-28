(function () {
  "use strict";

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const input        = document.getElementById("ref-input");
  const segEra       = document.getElementById("seg-era");
  const segModel     = document.getElementById("seg-model");
  const segBezel     = document.getElementById("seg-bezel");
  const segBracelet  = document.getElementById("seg-bracelet");
  const segSuffix    = document.getElementById("seg-suffix");
  const resultCard   = document.getElementById("result-card");
  const clearBtn     = document.getElementById("clear-btn");
  const exampleLabel = document.getElementById("example-label");
  const refFilter    = document.getElementById("ref-filter");

  // ── Parse raw input into logical segments ──────────────────────────────────
  function parse(raw) {
    const clean      = raw.replace(/[\s\-]/g, "").toUpperCase();
    const digitMatch = clean.match(/^(\d+)/);
    const digits     = digitMatch ? digitMatch[1] : "";
    const suffix     = clean.slice(digits.length);
    return {
      era:      digits.slice(0, 2),
      modelKey: digits.slice(0, 6),
      modelSeg: digits.slice(2, 5),
      bezelDig: digits[4] ?? "",   // 5th digit = bezel type code
      bracDig:  digits[5] ?? "",   // 6th digit = bracelet / material variant code
      suffix,
      digits,
      full: clean
    };
  }

  // ── Activate a segment box with animation ──────────────────────────────────
  function activateBox(box, valueId, decodedId, value, decoded, found) {
    const valueEl   = document.getElementById(valueId);
    const decodedEl = document.getElementById(decodedId);

    // Explicit null/empty check — prevents "0" from being treated as falsy
    valueEl.textContent   = (value !== "" && value != null) ? value : "—";
    decodedEl.textContent = decoded || (found ? "" : "Unknown");

    box.setAttribute("data-state", "active");
    box.classList.toggle("seg-unknown", !found && (value !== "" && value != null));
  }

  // ── Reset a box to waiting state ───────────────────────────────────────────
  function waitBox(box, valueId, decodedId, placeholder) {
    const valueEl   = document.getElementById(valueId);
    const decodedEl = document.getElementById(decodedId);

    valueEl.textContent   = placeholder;
    decodedEl.textContent = "";
    box.setAttribute("data-state", "waiting");
    box.classList.remove("seg-unknown");
  }

  // ── fillBox / animateIn — used for bracelet box with stagger support ───────
  const STAGGER = 60;
  let delay = 0;

  function fillBox(box, value, decoded, found) {
    box.classList.remove("hidden");
    activateBox(box, box.id + "-value", box.id + "-decoded", value, decoded, found);
  }

  function animateIn(/* box, delayMs */) {
    // Segment boxes animate via CSS data-state transitions
  }

  // ── Animate the result card sliding up ────────────────────────────────────
  function showCard(el) {
    el.classList.remove("hidden");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "cardSlideUp 350ms ease both";

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > window.innerHeight + 80) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  }

  // ── Build result card HTML ─────────────────────────────────────────────────
  function buildCard(parts, data) {
    const { eraData, modelData, bezelData, bracData, suffixData, communityName } = data;
    const { era, bezelDig, bracDig, suffix, digits } = parts;
    let rowIdx = 0;

    function cRow(label, value) {
      const d = rowIdx * 80;
      rowIdx++;
      return `<div class="card-row" style="animation: cardRowIn 300ms ease ${d}ms both">
        <span class="card-row-label">${label}</span>
        <span class="card-row-value">${value}</span>
      </div>`;
    }

    const known = modelData || eraData || bezelData || bracData;
    if (!known && digits.length < 2) return null;

    const isPartial = !modelData && digits.length >= 2;

    let html = `<div class="card-full-header">
      <span class="card-full-label">Full Reference Decoded</span>
    </div>`;

    if (isPartial) {
      html += `<div class="card-partial-notice">
        ⚡ This exact reference isn't in our database yet — but here's what the digits tell us:
      </div>`;
    }

    const modelName = modelData?.name || "Unknown Model";
    const material  = modelData?.material || (isPartial ? "—" : "Unknown");
    const category  = modelData?.category || "";

    html += `<div class="card-header">
      <span class="card-ref">${parts.full}</span>
      <h2 class="card-model-name">${modelName}</h2>
      ${category ? `<span class="card-category">${category}</span>` : ""}
    </div>`;

    // Community / enthusiast name — shown prominently below model name
    if (communityName) {
      html += `<div class="card-known-as">
        <span class="known-as-label">Known As</span>
        <p class="known-as-value">&ldquo;The ${communityName}&rdquo;</p>
      </div>`;
    }

    html += `<div class="card-grid">`;
    html += cRow("Case Material", material);

    if (eraData) {
      html += cRow("Production Era", `${eraData.label} <span class="card-sub">${eraData.years}</span>`);
    }

    if (bezelData) {
      html += cRow("Bezel Type", `${bezelData.label}<span class="card-sub">${bezelData.description}</span>`);
    } else if (bezelDig !== "") {
      html += cRow("Bezel Type", `<span class="unknown-inline">Digit "${bezelDig}" — not in database</span>`);
    }

    if (suffixData) {
      html += cRow("Ceramic Bezel Insert", `<span class="ceramic-dot" style="background:${suffixData.color}"></span>${suffixData.label}<span class="card-sub">${suffixData.description}</span>`);
    }

    if (bracData) {
      html += cRow("Bracelet", `${bracData.label}<span class="card-sub">${bracData.description}</span>`);
    } else if (bracDig !== "") {
      html += cRow("Bracelet", `<span class="unknown-inline">Digit "${bracDig}" — not in database</span>`);
    }

    html += `</div>`;

    if (modelData?.significance) {
      html += `<div class="card-significance">
        <span class="sig-label">Why This Matters</span>
        <p>${modelData.significance}</p>
      </div>`;
    } else if (eraData?.note) {
      html += `<div class="card-significance">
        <span class="sig-label">Era Note</span>
        <p>${eraData.note}</p>
      </div>`;
    }

    html += `<div class="card-copy-row">
      <button class="copy-btn" id="copy-summary-btn" type="button">Copy Summary</button>
    </div>`;

    return html;
  }

  // ── Copy summary to clipboard ──────────────────────────────────────────────
  function copySummary(parts, data) {
    const { eraData, modelData, bezelData, bracData, suffixData, communityName } = data;
    const lines = [
      `Reference: ${parts.full}`,
      `Model: ${modelData?.name || "Unknown"}`,
      communityName ? `Known As: "The ${communityName}"` : null,
      `Material: ${modelData?.material || "—"}`,
      eraData    ? `Era: ${eraData.label} (${eraData.years})` : null,
      bezelData  ? `Bezel: ${bezelData.label}` : null,
      suffixData ? `Ceramic Bezel: ${suffixData.label}` : null,
      bracData   ? `Bracelet: ${bracData.label}` : null,
      modelData?.significance ? `Note: ${modelData.significance}` : null,
      `Decoded with RolliDex`,
      `rollidex.com`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      const btn = document.getElementById("copy-summary-btn");
      if (btn) { btn.textContent = "Copied ✓"; setTimeout(() => { btn.textContent = "Copy Summary"; }, 2000); }
    }).catch(() => {});
  }

  // ── Main decode routine ────────────────────────────────────────────────────
  let _lastParts = null, _lastData = null;

  function decode(raw) {
    delay = 0; // reset stagger delay for each decode call

    const parts = parse(raw);
    const { era, modelKey, modelSeg, bezelDig, bracDig, suffix, digits } = parts;

    // All lookups use explicit empty-string checks so digit "0" never gets skipped
    const eraData    = era !== ""      ? REF_DATA.era[era]           : null;
    const modelData  = modelKey !== "" ? REF_DATA.model[modelKey]    : null;
    const bezelData  = bezelDig !== "" ? REF_DATA.bezel[bezelDig]    : null;
    const bracData = (bracDig ? REF_DATA.bracelet[bracDig] : null) || (modelData?.bracelet ? { label: modelData.bracelet, description: "" } : null);
    const suffixData = suffix !== ""   ? REF_DATA.suffix[suffix]     : null;

    // Community name: look up suffix-specific nickname first, then model-level default
    const communityName = (modelData?.communityNames && suffix !== "")
      ? (modelData.communityNames[suffix] ?? modelData.communityName ?? null)
      : (modelData?.communityName ?? null);

    _lastParts = parts;
    _lastData  = { eraData, modelData, bezelData, bracData, suffixData, communityName };

    // ── Era box ──────────────────────────────────────────────────────────
    if (digits.length >= 2) {
      activateBox(segEra, "seg-era-value", "seg-era-decoded", era, eraData?.label, !!eraData);
    } else {
      waitBox(segEra, "seg-era-value", "seg-era-decoded", "- -");
    }

    // ── Model box ────────────────────────────────────────────────────────
    if (digits.length >= 3) {
      const displaySeg = digits.slice(2, 5).padEnd(3, "_");
      const modelLabel = modelData?.name || (digits.length >= 6 ? "Unknown Model" : "…");
      activateBox(segModel, "seg-model-value", "seg-model-decoded", displaySeg, modelLabel, !!modelData || digits.length < 6);
    } else {
      waitBox(segModel, "seg-model-value", "seg-model-decoded", "- - -");
    }

    // ── Bezel box — activates at digit 5 (index 4) ──────────────────────
    if (digits.length >= 5) {
      activateBox(segBezel, "seg-bezel-value", "seg-bezel-decoded", bezelDig, bezelData?.label, !!bezelData);
    } else {
      waitBox(segBezel, "seg-bezel-value", "seg-bezel-decoded", "-");
    }

    // ── Bracelet box — activates at digit 6 (index 5) ───────────────────
    if (digits.length >= 6) {
      fillBox(segBracelet, modelData?.bracelet || bracDig || "—", bracData?.label, !!bracData);
      animateIn(segBracelet, delay);
      delay += STAGGER;
    } else {
      segBracelet.classList.add("hidden");
    }

    // ── Suffix box ───────────────────────────────────────────────────────
    if (suffix !== "") {
      activateBox(segSuffix, "seg-suffix-value", "seg-suffix-decoded", suffix, suffixData?.label, !!suffixData);
      // Add community nickname as a secondary line in the suffix box
      if (communityName) {
        const decodedEl = document.getElementById("seg-suffix-decoded");
        decodedEl.innerHTML = `${suffixData ? suffixData.label : suffix}<br><span class="seg-community-name">&ldquo;The ${communityName}&rdquo;</span>`;
      }
    } else {
      waitBox(segSuffix, "seg-suffix-value", "seg-suffix-decoded", "- -");
    }

    // ── Result card ──────────────────────────────────────────────────────
    if (digits.length >= 6) {
      const cardHTML = buildCard(parts, { eraData, modelData, bezelData, bracData, suffixData, communityName });
      if (cardHTML) {
        resultCard.innerHTML = cardHTML;
        showCard(resultCard);

        const copyBtn = document.getElementById("copy-summary-btn");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => copySummary(_lastParts, _lastData));
        }
      }
    } else {
      resultCard.classList.add("hidden");
      resultCard.innerHTML = "";
    }
  }

  // ── URL parameter support ──────────────────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get("ref");
  if (urlRef) {
    input.value = urlRef;
    clearBtn.style.display = "";
    decode(urlRef);
  }

  // ── Input event ────────────────────────────────────────────────────────────
  let exampleActive = false;

  input.addEventListener("input", function () {
    exampleActive = false;
    exampleLabel.style.display = "none";
    clearBtn.style.display = this.value.length > 0 ? "" : "none";
    decode(this.value.trim());
  });

  // ── Clear button ───────────────────────────────────────────────────────────
  clearBtn.addEventListener("click", function () {
    input.value = "";
    exampleActive = false;
    exampleLabel.style.display = "none";
    clearBtn.style.display = "none";
    decode("");
    input.focus();
  });

  // ── Tooltip toggle (for mobile tap) ───────────────────────────────────────
  document.querySelectorAll(".seg-info-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const isOpen = this.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".seg-info-btn").forEach(b => b.setAttribute("aria-expanded", "false"));
      this.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });
  document.addEventListener("click", function () {
    document.querySelectorAll(".seg-info-btn").forEach(b => b.setAttribute("aria-expanded", "false"));
  });

  // ── Reference table filter ────────────────────────────────────────────────
  if (refFilter) {
    refFilter.addEventListener("input", function () {
      const q = this.value.toLowerCase().trim();

      document.querySelectorAll(".ref-table tbody tr").forEach(tr => {
        if (!tr.classList.contains("no-results-row")) {
          tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none";
        }
      });

      document.querySelectorAll(".ref-card").forEach(card => {
        const tbody = card.querySelector("tbody");
        if (!tbody) return;
        const visibleRows = Array.from(tbody.querySelectorAll("tr:not(.no-results-row)"))
          .filter(r => r.style.display !== "none");
        let noResult = tbody.querySelector(".no-results-row");
        if (q && visibleRows.length === 0) {
          if (!noResult) {
            noResult = document.createElement("tr");
            noResult.className = "no-results-row";
            noResult.innerHTML = `<td colspan="10" style="text-align:center;color:#666;padding:16px;font-style:italic">No references found for that search</td>`;
            tbody.appendChild(noResult);
          }
        } else {
          if (noResult) noResult.remove();
        }
      });
    });
  }

  // ── Pre-loaded example after 1 second ────────────────────────────────────
  const exampleTimer = setTimeout(function () {
    if (!input.value.trim()) {
      input.value = "116613";
      exampleActive = true;
      exampleLabel.style.display = "";
      clearBtn.style.display = "";
      decode("116613");
    }
  }, 1000);

  input.addEventListener("keydown", function () {
    if (exampleActive) return;
    clearTimeout(exampleTimer);
  }, { once: true });

})();
