(() => {
  const STORAGE_KEY = 'weather-monthly-report-state-v1';
  const STATE_VERSION = 3;
  const DAYS = 35;
  const HOURS_PER_RING = 12;
  const SLOTS_PER_DAY = 24;
  const INNER_HOUR_LABELS = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am'];
  const OUTER_HOUR_LABELS = ['12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
  const DIAL_VIEWBOX = 220;
  const DIAL_CENTER = 110;
  const DIAL_CENTER_R = 30;
  const DIAL_INNER_INNER_R = 34;
  const DIAL_INNER_OUTER_R = 66;
  const DIAL_OUTER_INNER_R = 76;
  const DIAL_OUTER_OUTER_R = 108;

  const WEATHER_DEFAULTS = [
    { id: 'fair', label: 'Fair', color: '#f6c453', enabled: false },
    { id: 'cloudy', label: 'Cloudy', color: '#93a7b7', enabled: false },
    { id: 'rainshower', label: 'Rainshower', color: '#4c8bf5', enabled: false },
    { id: 'heavy-rains', label: 'Heavy rains', color: '#1958b2', enabled: false },
    { id: 'stormy', label: 'Stormy', color: '#5b4bb7', enabled: false },
    { id: 'sunny', label: 'Sunny', color: '#ffffff', enabled: true },
    { id: 'rain', label: 'Rain', color: '#2f6fed', enabled: true },
  ];
  const WEATHER = WEATHER_DEFAULTS.map((item) => ({ ...item }));

  const els = {
    startDate: document.getElementById('startDate'),
    reportTitle: document.getElementById('reportTitle'),
    reportStartLabel: document.getElementById('reportStartLabel'),
    selectedWeatherLabel: document.getElementById('selectedWeatherLabel'),
    paintedCount: document.getElementById('paintedCount'),
    palette: document.getElementById('palette'),
    slotLegend: document.getElementById('slotLegend'),
    grid: document.getElementById('grid'),
    jsonOut: document.getElementById('jsonOut'),
    reportHeading: document.getElementById('reportHeading'),
    selectedWeatherSwatch: document.getElementById('selectedWeatherSwatch'),
    selectedWeatherText: document.getElementById('selectedWeatherText'),
    clearDayBtn: document.getElementById('clearDayBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    hideIndicator: document.getElementById('hideIndicator'),
    indicatorColor: document.getElementById('indicatorColor'),
    gridRows: document.getElementById('gridRows'),
    indicatorToggles: document.getElementById('indicatorToggles'),
  };

  const state = {
    title: 'Weather report',
    startDate: localDateString(new Date()),
    activeWeatherId: WEATHER[0].id,
    selectedDay: 0,
    selectedSlot: 0,
    slots: Array.from({ length: DAYS }, () => Array(SLOTS_PER_DAY).fill(null)),
    hideIndicator: false,
    indicatorColor: '#1b4f72',
    gridRows: 6,
  };

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function localDateString(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function parseLocalDate(value) {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function addDays(date, days) {
    const out = new Date(date);
    out.setHours(0, 0, 0, 0);
    out.setDate(out.getDate() + days);
    return out;
  }

  function formatDateLabel(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function weatherById(id) {
    return WEATHER.find((item) => item.id === id) || WEATHER[0];
  }

  function enabledWeatherList() {
    return WEATHER.filter((item) => item.enabled);
  }

  function normalizedGridRows() {
    const rows = Number(state.gridRows);
    if (!Number.isFinite(rows)) return 6;
    return Math.max(5, Math.min(7, Math.round(rows)));
  }

  function gridColumns() {
    return 5;
  }

  function cardHeightForRows() {
    const rows = normalizedGridRows();
    if (rows <= 5) return 360;
    if (rows === 6) return 332;
    return 300;
  }

  function resetWeatherDefaults() {
    WEATHER.forEach((item, index) => {
      Object.assign(item, WEATHER_DEFAULTS[index]);
    });
  }

  function hexToRgb(color) {
    const normalized = String(color || '').trim().toLowerCase();
    const short = normalized.match(/^#([0-9a-f]{3})$/i);
    if (short) {
      const value = short[1];
      return {
        r: parseInt(value[0] + value[0], 16),
        g: parseInt(value[1] + value[1], 16),
        b: parseInt(value[2] + value[2], 16),
      };
    }
    const full = normalized.match(/^#([0-9a-f]{6})$/i);
    if (full) {
      const value = full[1];
      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
      };
    }
    return null;
  }

  function isLightColor(color) {
    const rgb = hexToRgb(color);
    if (!rgb) return false;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 >= 175;
  }

  function sliceStrokeColor(fillColor) {
    return isLightColor(fillColor) ? 'rgba(23, 50, 76, 0.55)' : 'rgba(255, 255, 255, 0.78)';
  }

  function sliceLabelColor(fillColor) {
    return isLightColor(fillColor) ? '#17324c' : '#ffffff';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawSlicePath(ctx, cx, cy, innerR, outerR, startAngle, endAngle) {
    const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
    const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, endAngle);
    const startInner = polarToCartesian(cx, cy, innerR, startAngle);
    ctx.beginPath();
    ctx.moveTo(startOuter.x, startOuter.y);
    ctx.arc(cx, cy, outerR, ((startAngle - 90) * Math.PI) / 180, ((endAngle - 90) * Math.PI) / 180);
    ctx.lineTo(endInner.x, endInner.y);
    ctx.arc(cx, cy, innerR, ((endAngle - 90) * Math.PI) / 180, ((startAngle - 90) * Math.PI) / 180, true);
    ctx.closePath();
  }

  function sliceMidpoint(cx, cy, innerR, outerR, startAngle, endAngle) {
    return polarToCartesian(cx, cy, (innerR + outerR) / 2, startAngle + (endAngle - startAngle) / 2);
  }

  function sliceLabelPoint(cx, cy, innerR, outerR, startAngle, endAngle) {
    const angle = startAngle + (endAngle - startAngle) / 2;
    const radius = innerR + (outerR - innerR) * 0.52;
    return polarToCartesian(cx, cy, radius, angle);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function bytesToBinaryString(bytes) {
    let out = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      out += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return out;
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function sanitizeFilename(name, fallback) {
    return String(name || fallback)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;
  }

  function buildPdfWithJpeg(jpegBytes, widthPx, heightPx) {
    const widthPt = Math.round((widthPx * 72) / 96);
    const heightPt = Math.round((heightPx * 72) / 96);
    const imageStream = bytesToBinaryString(jpegBytes);
    const objects = [];
    const pushObj = (body) => {
      const id = objects.length + 1;
      objects.push(`${id} 0 obj\n${body}\nendobj\n`);
      return id;
    };

    const catalogId = pushObj('<< /Type /Catalog /Pages 2 0 R >>');
    const pagesId = pushObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    pushObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] ` +
      '/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> ' +
      '/Contents 5 0 R >>',
    );
    pushObj(
      `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n${imageStream}\nendstream`,
    );
    const contentStream = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im0 Do\nQ`;
    pushObj(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  function getExportLayout() {
    return {
      width: 1680,
      margin: 60,
      headerH: 210,
      gap: 18,
      cols: gridColumns(),
      cardH: cardHeightForRows(),
    };
  }

  function drawExportReport(ctx, width, height) {
    const layout = getExportLayout();
    const { margin, headerH, gap, cols, cardH } = layout;
    const start = parseLocalDate(state.startDate) || new Date();
    const contentW = width - margin * 2;
    const cardW = (contentW - gap * (cols - 1)) / cols;
    const rows = Math.ceil(DAYS / cols);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#102033';
    ctx.font = '800 40px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(state.title || 'Weather report', margin, 84);
    ctx.font = '500 18px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
    ctx.fillStyle = '#456177';
    ctx.fillText(`Start date: ${formatDateLabel(start)}`, margin, 116);

    const paletteY = 146;
    enabledWeatherList().forEach((item, idx) => {
      const x = margin + idx * 248;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 10, paletteY + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17324c';
      ctx.font = '600 14px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
      ctx.fillText(item.label, x + 28, paletteY + 13);
    });

    const gridTop = headerH;
    for (let dayIdx = 0; dayIdx < DAYS; dayIdx += 1) {
      const row = Math.floor(dayIdx / cols);
      const col = dayIdx % cols;
      const x = margin + col * (cardW + gap);
      const y = gridTop + row * (cardH + gap);
      const date = addDays(start, dayIdx);
      const slotCount = state.slots[dayIdx];
      const dayNo = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });

      ctx.save();
      ctx.shadowColor = 'rgba(18, 45, 70, 0.08)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      drawRoundedRect(ctx, x, y, cardW, cardH, 24);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(23, 50, 76, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#17324c';
      ctx.font = '800 20px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(dayNo), x + 18, y + 28);
      ctx.fillStyle = '#60809b';
      ctx.font = '700 11px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
      ctx.fillText(month.toUpperCase(), x + 18, y + 46);

      const cx = x + cardW / 2;
      const cy = y + 148;
      const innerOuterR = DIAL_INNER_OUTER_R;
      const innerInnerR = DIAL_INNER_INNER_R;
      const outerInnerR = DIAL_OUTER_INNER_R;
      const outerOuterR = DIAL_OUTER_OUTER_R;
      const sliceAngle = 360 / HOURS_PER_RING;
      for (let slotIdx = 0; slotIdx < SLOTS_PER_DAY; slotIdx += 1) {
        const isInner = slotIdx < HOURS_PER_RING;
        const layerIndex = isInner ? slotIdx : slotIdx - HOURS_PER_RING;
        const weatherId = slotCount[slotIdx] || 'sunny';
        const startAngle = layerIndex * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const fillColor = weatherById(weatherId).color;
        drawSlicePath(ctx, cx, cy, isInner ? innerInnerR : outerInnerR, isInner ? innerOuterR : outerOuterR, startAngle, endAngle);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = sliceStrokeColor(fillColor);
        ctx.lineWidth = 1;
        ctx.stroke();

        const label = isInner ? INNER_HOUR_LABELS[layerIndex] : OUTER_HOUR_LABELS[layerIndex];
        const labelPos = sliceLabelPoint(
          cx,
          cy,
          isInner ? innerInnerR : outerInnerR,
          isInner ? innerOuterR : outerOuterR,
          startAngle,
          endAngle,
        );
        ctx.save();
        ctx.fillStyle = sliceLabelColor(fillColor);
        ctx.font = `700 ${isInner ? 8.5 : 9.5}px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, labelPos.x, labelPos.y);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(23, 50, 76, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#17324c';
      ctx.textAlign = 'center';
      ctx.font = '800 20px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
      ctx.fillText(String(dayNo), cx, cy - 2);
      ctx.fillStyle = '#5e758b';
      ctx.font = '700 10px "Trebuchet MS", "Gill Sans", "Segoe UI", sans-serif';
      ctx.fillText(month.toUpperCase(), cx, cy + 15);
    }
  }

  async function buildExportCanvas() {
    const layout = getExportLayout();
    const rows = Math.ceil(DAYS / layout.cols);
    const width = layout.width;
    const height = layout.headerH + rows * layout.cardH + (rows - 1) * layout.gap + layout.margin;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.textBaseline = 'alphabetic';
    drawExportReport(ctx, width, height);
    return canvas;
  }

  async function exportPng() {
    const canvas = await buildExportCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('PNG export failed');
    downloadBlob(blob, `${sanitizeFilename(state.title, 'weather-report')}.png`);
  }

  async function exportPdf() {
    const canvas = await buildExportCanvas();
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = jpegDataUrl.split(',')[1];
    const jpegBytes = base64ToBytes(base64);
    const pdfText = buildPdfWithJpeg(jpegBytes, canvas.width, canvas.height);
    downloadBlob(new Blob([pdfText], { type: 'application/pdf' }), `${sanitizeFilename(state.title, 'weather-report')}.pdf`);
  }

  function clampIndex(idx, max) {
    return Math.max(0, Math.min(max, idx));
  }

  function createSvgEl(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  }

  function slicePath(cx, cy, innerR, outerR, startAngle, endAngle) {
    const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
    const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  function appendSliceLabel(parent, cx, cy, innerR, outerR, startAngle, endAngle, text, fillColor) {
    const midpoint = sliceLabelPoint(cx, cy, innerR, outerR, startAngle, endAngle);
    const label = createSvgEl('text');
    label.setAttribute('x', midpoint.x.toFixed(2));
    label.setAttribute('y', midpoint.y.toFixed(2));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('class', 'slice-label');
    label.style.fill = sliceLabelColor(fillColor);
    label.textContent = text;
    parent.appendChild(label);
  }

  function safeCloneSlots(slots) {
    if (!Array.isArray(slots)) {
      return Array.from({ length: DAYS }, () => Array(SLOTS_PER_DAY).fill(null));
    }
    return Array.from({ length: DAYS }, (_, dayIdx) => {
      const day = slots[dayIdx];
      if (!Array.isArray(day)) return Array(SLOTS_PER_DAY).fill(null);
      return day.slice(0, SLOTS_PER_DAY).map((slot) => slot || null).concat(Array(Math.max(0, SLOTS_PER_DAY - day.length)).fill(null)).slice(0, SLOTS_PER_DAY);
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const isCurrentSchema = parsed.schemaVersion === STATE_VERSION;
        if (typeof parsed.title === 'string') state.title = parsed.title;
        if (typeof parsed.startDate === 'string' && parseLocalDate(parsed.startDate)) state.startDate = parsed.startDate;
        if (typeof parsed.activeWeatherId === 'string' && WEATHER.some((item) => item.id === parsed.activeWeatherId)) {
          state.activeWeatherId = parsed.activeWeatherId;
        }
        if (typeof parsed.hideIndicator === 'boolean') state.hideIndicator = parsed.hideIndicator;
        if (typeof parsed.indicatorColor === 'string') state.indicatorColor = parsed.indicatorColor;
        if (typeof parsed.gridRows === 'number') state.gridRows = parsed.gridRows;
        if (Array.isArray(parsed.slots)) state.slots = safeCloneSlots(parsed.slots);
        if (isCurrentSchema && Array.isArray(parsed.indicators)) {
          parsed.indicators.forEach((entry) => {
            const item = WEATHER.find((w) => w.id === entry?.id);
            if (item && typeof entry.enabled === 'boolean') item.enabled = entry.enabled;
            if (item && typeof entry.color === 'string') item.color = entry.color;
          });
        } else {
          resetWeatherDefaults();
        }
      }
    } catch (err) {
      console.warn('Failed to load saved weather report', err);
    }
  }

  function saveState() {
    try {
      const payload = serializeState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      els.jsonOut.value = JSON.stringify(payload, null, 2);
    } catch (err) {
      console.warn('Failed to save weather report state', err);
      els.jsonOut.value = JSON.stringify(serializeState(), null, 2);
    }
  }

  function serializeState() {
    return {
      title: state.title,
      startDate: state.startDate,
      activeWeatherId: state.activeWeatherId,
      slots: state.slots,
      hideIndicator: state.hideIndicator,
      indicatorColor: state.indicatorColor,
      gridRows: normalizedGridRows(),
      schemaVersion: STATE_VERSION,
      indicators: WEATHER.map((item) => ({ id: item.id, label: item.label, color: item.color, enabled: item.enabled })),
    };
  }

  function updateSummary() {
    const reportStart = parseLocalDate(state.startDate) || new Date();
    const painted = state.slots.flat().filter(Boolean).length;
    els.reportStartLabel.textContent = formatDateLabel(reportStart);
    els.reportHeading.textContent = state.title || 'Weather report';
    const activeWeather = weatherById(state.activeWeatherId);
    els.selectedWeatherText.textContent = activeWeather.label;
    els.selectedWeatherSwatch.style.background = state.indicatorColor;
    els.selectedWeatherSwatch.style.display = state.hideIndicator ? 'none' : 'inline-block';
    els.selectedWeatherLabel.classList.toggle('hide-indicator', state.hideIndicator);
    els.paintedCount.textContent = `${painted} / ${DAYS * SLOTS_PER_DAY}`;
  }

  function renderPalette() {
    els.palette.innerHTML = '';
    enabledWeatherList().forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `palette-btn${item.id === state.activeWeatherId ? ' selected' : ''}`;
      btn.dataset.weatherId = item.id;
      btn.innerHTML = `<span class="swatch" style="background:${item.color}"></span><span>${item.label}</span>`;
      btn.addEventListener('click', () => {
        state.activeWeatherId = item.id;
        renderPalette();
        updateSummary();
        saveState();
      });
      els.palette.appendChild(btn);
    });
  }

  function renderIndicatorToggles() {
    els.indicatorToggles.innerHTML = '';
    WEATHER.forEach((item) => {
      const row = document.createElement('label');
      row.className = 'indicator-toggle';
      row.innerHTML = `
        <input type="checkbox" data-weather-id="${item.id}" ${item.enabled ? 'checked' : ''} />
        <span class="indicator-toggle-color" style="background:${item.color}"></span>
        <span>${item.label}</span>
      `;
      row.querySelector('input').addEventListener('change', (ev) => {
        item.enabled = ev.target.checked;
        if (state.activeWeatherId === item.id && !item.enabled) {
          const fallback = enabledWeatherList()[0] || WEATHER[0];
          state.activeWeatherId = fallback.id;
        }
        renderPalette();
        renderIndicatorToggles();
        updateSummary();
        saveState();
      });
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = item.color;
      colorInput.className = 'indicator-color-input';
      colorInput.addEventListener('input', () => {
        item.color = colorInput.value;
        if (state.activeWeatherId === item.id) updateSummary();
        renderPalette();
        renderIndicatorToggles();
        saveState();
      });
      row.appendChild(colorInput);
      els.indicatorToggles.appendChild(row);
    });
  }

  function renderSlotLegend() {
    els.slotLegend.innerHTML = '';
    const groups = [
      { title: 'Inner ring: 12am - 11am', labels: INNER_HOUR_LABELS },
      { title: 'Outer ring: 12pm - 11pm', labels: OUTER_HOUR_LABELS },
    ];
    groups.forEach((group) => {
      const block = document.createElement('div');
      const heading = document.createElement('div');
      heading.className = 'slot-group-title';
      heading.textContent = group.title;
      block.appendChild(heading);
      const row = document.createElement('div');
      row.className = 'slot-row';
      group.labels.forEach((label) => {
        const pill = document.createElement('div');
        pill.className = 'slot-pill';
        pill.textContent = label;
        row.appendChild(pill);
      });
      block.appendChild(row);
      els.slotLegend.appendChild(block);
    });
  }

  function renderGrid() {
    els.grid.innerHTML = '';
    const cols = gridColumns();
    els.grid.style.setProperty('--grid-cols', String(cols));
    els.grid.style.setProperty('--day-card-height', `${cardHeightForRows()}px`);
    const start = parseLocalDate(state.startDate) || new Date();

    for (let dayIdx = 0; dayIdx < DAYS; dayIdx += 1) {
      const date = addDays(start, dayIdx);
      const card = document.createElement('article');
      card.className = 'day-card';
      card.dataset.day = String(dayIdx);
      if (dayIdx === state.selectedDay) card.classList.add('selected');

      const head = document.createElement('div');
      head.className = 'day-head';
      head.innerHTML = `
        <div class="day-num">${date.getDate()}</div>
        <div class="day-date">${formatDateLabel(date)}</div>
      `;
      card.appendChild(head);

      const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      wrap.classList.add('dial');
      wrap.setAttribute('viewBox', `0 0 ${DIAL_VIEWBOX} ${DIAL_VIEWBOX}`);
      wrap.setAttribute('aria-label', `${formatDateLabel(date)} weather dial`);

      const cx = DIAL_CENTER;
      const cy = DIAL_CENTER;
      const slotCount = Array.isArray(state.slots[dayIdx]) ? state.slots[dayIdx] : Array(SLOTS_PER_DAY).fill(null);
      const sliceAngle = 360 / HOURS_PER_RING;

      const center = createSvgEl('circle');
      center.setAttribute('cx', cx);
      center.setAttribute('cy', cy);
      center.setAttribute('r', DIAL_CENTER_R);
      center.setAttribute('class', 'ring-center');
      wrap.appendChild(center);

      for (let slotIdx = 0; slotIdx < SLOTS_PER_DAY; slotIdx += 1) {
        const isInner = slotIdx < HOURS_PER_RING;
        const layerIndex = isInner ? slotIdx : slotIdx - HOURS_PER_RING;
        const startAngle = layerIndex * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const innerR = isInner ? DIAL_INNER_INNER_R : DIAL_OUTER_INNER_R;
        const outerR = isInner ? DIAL_INNER_OUTER_R : DIAL_OUTER_OUTER_R;
        const weatherId = slotCount[slotIdx] || 'sunny';
        const fillColor = weatherById(weatherId).color;
        const segment = createSvgEl('path');
        segment.setAttribute('d', slicePath(cx, cy, innerR, outerR, startAngle, endAngle));
        segment.setAttribute('class', `ring-segment${slotCount[slotIdx] ? ' filled' : ''}`);
        segment.dataset.day = String(dayIdx);
        segment.dataset.slot = String(slotIdx);
        segment.dataset.date = localDateString(date);
        segment.dataset.slotLabel = isInner ? INNER_HOUR_LABELS[layerIndex] : OUTER_HOUR_LABELS[layerIndex];

        segment.style.fill = fillColor;
        segment.style.stroke = sliceStrokeColor(fillColor);
        segment.setAttribute('data-weather', weatherId);
        segment.setAttribute('stroke-dasharray', '0');
        segment.setAttribute('title', `${formatDateLabel(date)} • ${segment.dataset.slotLabel} • ${weatherById(weatherId).label}`);

        segment.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          paintSlot(dayIdx, slotIdx, ev.altKey || ev.button === 2);
        });
        segment.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          paintSlot(dayIdx, slotIdx, true);
        });

        wrap.appendChild(segment);

        appendSliceLabel(
          wrap,
          cx,
          cy,
          innerR,
          outerR,
          startAngle,
          endAngle,
          segment.dataset.slotLabel,
          fillColor,
        );
      }

      const dialWrap = document.createElement('div');
      dialWrap.className = 'dial-wrap';
      dialWrap.appendChild(wrap);

      const dayLabel = createSvgEl('text');
      dayLabel.setAttribute('x', String(DIAL_CENTER));
      dayLabel.setAttribute('y', '104');
      dayLabel.setAttribute('text-anchor', 'middle');
      dayLabel.setAttribute('class', 'center-label');
      dayLabel.textContent = String(date.getDate());
      wrap.appendChild(dayLabel);

      const monthLabel = createSvgEl('text');
      monthLabel.setAttribute('x', String(DIAL_CENTER));
      monthLabel.setAttribute('y', '124');
      monthLabel.setAttribute('text-anchor', 'middle');
      monthLabel.setAttribute('class', 'dial-label');
      monthLabel.textContent = date.toLocaleDateString('en-US', { month: 'short' });
      wrap.appendChild(monthLabel);

      card.appendChild(dialWrap);

      card.addEventListener('click', () => {
        state.selectedDay = dayIdx;
        state.selectedSlot = clampIndex(state.selectedSlot, 4);
        renderGrid();
        updateSummary();
        saveState();
      });

      els.grid.appendChild(card);
    }

    const fillers = Math.ceil(DAYS / cols) * cols - DAYS;
    for (let i = 0; i < fillers; i += 1) {
      const filler = document.createElement('article');
      filler.className = 'grid-filler';
      filler.setAttribute('aria-hidden', 'true');
      els.grid.appendChild(filler);
    }

  }

  function paintSlot(dayIdx, slotIdx, erase = false) {
    const day = state.slots[dayIdx];
    if (!day) return;
    day[slotIdx] = erase ? null : state.activeWeatherId;
    state.selectedDay = dayIdx;
    state.selectedSlot = slotIdx;
    renderGrid();
    updateSummary();
    saveState();
  }

  function clearDay(dayIdx) {
    if (!state.slots[dayIdx]) return;
    state.slots[dayIdx] = Array(SLOTS_PER_DAY).fill(null);
    renderGrid();
    updateSummary();
    saveState();
  }

  function clearAll() {
    state.slots = Array.from({ length: DAYS }, () => Array(SLOTS_PER_DAY).fill(null));
    renderGrid();
    updateSummary();
    saveState();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(serializeState(), null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'monthly-weather-report.json');
  }

  async function importJsonFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
    if (typeof parsed.title === 'string') state.title = parsed.title;
    if (typeof parsed.startDate === 'string' && parseLocalDate(parsed.startDate)) state.startDate = parsed.startDate;
    if (typeof parsed.activeWeatherId === 'string' && WEATHER.some((item) => item.id === parsed.activeWeatherId)) {
      state.activeWeatherId = parsed.activeWeatherId;
    }
    if (typeof parsed.hideIndicator === 'boolean') state.hideIndicator = parsed.hideIndicator;
    if (typeof parsed.indicatorColor === 'string') state.indicatorColor = parsed.indicatorColor;
    if (typeof parsed.gridRows === 'number') state.gridRows = parsed.gridRows;
    if (Array.isArray(parsed.slots)) state.slots = safeCloneSlots(parsed.slots);
    if (Array.isArray(parsed.indicators)) {
      parsed.indicators.forEach((entry) => {
        const item = WEATHER.find((w) => w.id === entry?.id);
        if (item && typeof entry.enabled === 'boolean') item.enabled = entry.enabled;
        if (item && typeof entry.color === 'string') item.color = entry.color;
      });
    }
    state.gridRows = normalizedGridRows();
    els.reportTitle.value = state.title;
    els.startDate.value = state.startDate;
    els.hideIndicator.checked = state.hideIndicator;
    els.indicatorColor.value = state.indicatorColor;
    els.gridRows.value = String(normalizedGridRows());
    renderPalette();
    renderIndicatorToggles();
    renderGrid();
    updateSummary();
    saveState();
  }

  function bindEvents() {
    els.hideIndicator.addEventListener('change', () => {
      state.hideIndicator = els.hideIndicator.checked;
      updateSummary();
      saveState();
    });

    els.indicatorColor.addEventListener('input', () => {
      state.indicatorColor = els.indicatorColor.value;
      updateSummary();
      saveState();
    });

    els.gridRows.addEventListener('input', () => {
      state.gridRows = normalizedGridRows();
      els.gridRows.value = String(state.gridRows);
      renderGrid();
      updateSummary();
      saveState();
    });

    els.startDate.addEventListener('input', () => {
      if (!parseLocalDate(els.startDate.value)) return;
      state.startDate = els.startDate.value;
      renderGrid();
      updateSummary();
      saveState();
    });

    els.reportTitle.addEventListener('input', () => {
      state.title = els.reportTitle.value.trim() || 'Weather report';
      updateSummary();
      saveState();
    });

    els.clearDayBtn.addEventListener('click', () => clearDay(state.selectedDay));
    els.clearAllBtn.addEventListener('click', clearAll);
    els.exportPngBtn.addEventListener('click', async () => {
      try {
        await exportPng();
      } catch (err) {
        alert(`PNG export failed: ${err?.message || err}`);
      }
    });
    els.exportPdfBtn.addEventListener('click', async () => {
      try {
        await exportPdf();
      } catch (err) {
        alert(`PDF export failed: ${err?.message || err}`);
      }
    });
    els.exportBtn.addEventListener('click', exportJson);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', async () => {
      const [file] = els.importFile.files || [];
      if (!file) return;
      try {
        await importJsonFile(file);
      } catch (err) {
        alert(`Import failed: ${err?.message || err}`);
      } finally {
        els.importFile.value = '';
      }
    });

    window.addEventListener('keydown', (ev) => {
      if (ev.key >= '1' && ev.key <= '5') {
        const idx = Number(ev.key) - 1;
        const item = enabledWeatherList()[idx];
        if (!item) return;
        state.activeWeatherId = item.id;
        renderPalette();
        updateSummary();
        saveState();
      }
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        clearDay(state.selectedDay);
      }
    });
  }

  function init() {
    loadState();
    state.gridRows = normalizedGridRows();
    els.startDate.value = state.startDate;
    els.reportTitle.value = state.title;
    els.hideIndicator.checked = state.hideIndicator;
    els.indicatorColor.value = state.indicatorColor;
    els.gridRows.value = String(normalizedGridRows());
    if (!enabledWeatherList().some((item) => item.id === state.activeWeatherId)) {
      const fallback = enabledWeatherList()[0] || WEATHER[0];
      fallback.enabled = true;
      state.activeWeatherId = fallback.id;
    }
    els.jsonOut.value = JSON.stringify(serializeState(), null, 2);
    renderPalette();
    renderSlotLegend();
    renderIndicatorToggles();
    renderGrid();
    updateSummary();
    bindEvents();
    saveState();
  }

  init();
})();
