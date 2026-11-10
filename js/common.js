/**
 * common.js
 * Utilidades gráficas compartidas (Canvas 2D pixel-art), constantes físico-químicas,
 * retratos de personajes y graficador científico para los 4 TPs de Introducción a la Química.
 */

window.LabCommon = (function () {
  let animTick = 0;

  const CONSTANTS = {
    R_ATM_L: 0.082057, // L·atm/(mol·K)
    R_CAL: 1.987,      // cal/(mol·K)
    T_ZERO_K: 273.15,
    P_STD_TORR: 760.0,
    G_ACCEL: 9.80665,
    HG_DENSITY: 13.5951 // g/cm³
  };

  const CHARACTERS = {
    jtp: {
      name: 'Jefe de Trabajos Prácticos (JTP)',
      role: 'Cátedra de Introducción a la Química · UNLP',
      color: '#ffd166'
    },
    ayudante: {
      name: 'Ayudante de Cátedra',
      role: 'Guía Experimental y Consultas de Mesada',
      color: '#7bdff2'
    },
    alerta: {
      name: 'Observación de Laboratorio',
      role: 'Control de Procedimiento y Seguridad',
      color: '#ff5964'
    }
  };

  /**
   * Densidad del agua líquida pura (g/mL) entre 10 °C y 35 °C (Tabla Kell / CRC)
   */
  function getWaterDensity(tempC) {
    const t = Math.max(5, Math.min(99, Number(tempC) || 20));
    // Fórmula empírica de alta precisión para agua destilada desgasificada (0 a 40 °C)
    const rho =
      (999.83952 +
        16.945176 * t -
        7.9870401e-3 * t * t -
        46.170461e-6 * t * t * t +
        105.56302e-9 * Math.pow(t, 4) -
        280.54253e-12 * Math.pow(t, 5)) /
      (1 + 16.87985e-3 * t);
    return rho / 1000.0; // g/mL
  }

  /**
   * Presión de vapor del agua (torr / mmHg) en función de T (°C) mediante ecuación de Antoine
   */
  function getWaterVaporPressureTorr(tempC) {
    const t = Math.max(0, Math.min(100, Number(tempC) || 20));
    // log10(P_mmHg) = A - B / (C + T)
    const A = 8.07131;
    const B = 1730.63;
    const C = 233.426;
    return Math.pow(10, A - B / (C + t));
  }

  /**
   * Regresión lineal por cuadrados mínimos: y = slope * x + intercept
   */
  function linearRegression(points) {
    const n = points.length;
    if (n < 2) {
      return { slope: 0, intercept: 0, r2: 1 };
    }
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      const x = points[i].x;
      const y = points[i].y;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    }
    const denom = n * sumXX - sumX * sumX;
    if (Math.abs(denom) < 1e-12) {
      return { slope: 0, intercept: sumY / n, r2: 0 };
    }
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const numR = n * sumXY - sumX * sumY;
    const denR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const r = denR > 1e-12 ? numR / denR : 1;

    return {
      slope: slope,
      intercept: intercept,
      r2: r * r
    };
  }

  function nextTick() {
    animTick++;
    return animTick;
  }

  function getTick() {
    return animTick;
  }

  /**
   * Dibuja un rectángulo estilo consola pixel-art con borde
   */
  function drawPixelBox(ctx, x, y, w, h, fill, border = '#ffffff', borderW = 2) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    if (border && borderW > 0) {
      ctx.strokeStyle = border;
      ctx.lineWidth = borderW;
      ctx.strokeRect(
        Math.floor(x) + 1,
        Math.floor(y) + 1,
        Math.floor(w) - 2,
        Math.floor(h) - 2
      );
    }
    ctx.restore();
  }

  /**
   * Dibuja el fondo estándar del laboratorio de Química (pared azulejada, mesada y cartel superior)
   */
  function drawLabBackground(ctx, w, h, bannerText, benchYOffset = 62) {
    ctx.save();
    // Fondo general
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, 0, w, h);

    // Azulejos de laboratorio sutiles
    const benchTop = h - benchYOffset;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.038)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 36) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, benchTop);
      ctx.stroke();
    }
    for (let gy = 0; gy < benchTop; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Mesada de laboratorio
    ctx.fillStyle = '#22283a';
    ctx.fillRect(0, benchTop, w, benchYOffset);
    ctx.fillStyle = '#3b445e';
    ctx.fillRect(0, benchTop, w, 5);

    // Cartel superior si existe
    if (bannerText) {
      drawPixelBox(ctx, 16, 10, w - 32, 30, '#1a2133', '#ffd166', 2);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bannerText, w / 2, 25);
    }
    ctx.restore();
  }

  /**
   * Dibuja el retrato pixel-art en el canvas de avatar (64x64)
   */
  function drawPortrait(canvas, speaker, mood = 'normal') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const bgColors = {
      jtp: '#26293e',
      ayudante: '#1a3250',
      alerta: '#461523'
    };
    ctx.fillStyle = bgColors[speaker] || '#26293e';
    ctx.fillRect(0, 0, w, h);

    if (speaker === 'alerta') {
      ctx.fillStyle = '#ff5964';
      ctx.beginPath();
      ctx.arc(32, 32, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 32, 33);
      return;
    }

    // Guardapolvo blanco de laboratorio
    ctx.fillStyle = '#f1faee';
    ctx.fillRect(10, 44, 44, 20);
    // Solapa y camisa
    ctx.fillStyle = speaker === 'jtp' ? '#457b9d' : '#2a9d8f';
    ctx.fillRect(26, 44, 12, 20);
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 44, 44, 20);

    // Rostro
    ctx.fillStyle = '#f4a261';
    ctx.fillRect(18, 16, 28, 26);

    if (speaker === 'jtp') {
      // Cabello y barba prolija del JTP
      ctx.fillStyle = '#4a4e69';
      ctx.fillRect(16, 10, 32, 8);
      ctx.fillRect(18, 34, 28, 8);
      ctx.fillStyle = '#f4a261';
      ctx.fillRect(26, 36, 12, 3);

      // Gafas de seguridad / lectura
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 21, 10, 8);
      ctx.strokeRect(34, 21, 10, 8);
      ctx.beginPath();
      ctx.moveTo(30, 25);
      ctx.lineTo(34, 25);
      ctx.stroke();

      // Ojos
      ctx.fillStyle = '#111';
      ctx.fillRect(24, 24, 3, 3);
      ctx.fillRect(38, 24, 3, 3);

      // Mate tradicional en la mesada al costado
      ctx.fillStyle = '#6f4e37';
      ctx.fillRect(46, 43, 12, 14);
      ctx.strokeStyle = '#d9d9d9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(52, 43);
      ctx.lineTo(56, 33);
      ctx.stroke();
    } else {
      // Ayudante de Cátedra
      ctx.fillStyle = '#3d2c2e';
      ctx.fillRect(15, 9, 34, 9);
      ctx.fillRect(14, 16, 4, 18);
      ctx.fillRect(46, 16, 4, 18);
      // Gafas de protección transparentes
      ctx.strokeStyle = '#7bdff2';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 21, 10, 7);
      ctx.strokeRect(34, 21, 10, 7);
      ctx.fillStyle = '#111';
      ctx.fillRect(23, 23, 4, 4);
      ctx.fillRect(37, 23, 4, 4);
      ctx.fillStyle = '#e76f51';
      ctx.fillRect(27, 34, 10, 3);
    }
  }

  /**
   * Dibuja un mechero Bunsen con llama animada opcional
   */
  function drawBunsen(ctx, x, y, isLit = false) {
    ctx.save();
    // Base del mechero
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x - 16, y - 5, 32, 5);
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x - 4, y - 34, 8, 29);
    // Collarín de regulación de aire
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(x - 6, y - 12, 12, 5);

    if (isLit) {
      const flicker = Math.sin(animTick * 0.35) * 2.5;
      // Cono externo oxidante (azul violáceo)
      ctx.fillStyle = 'rgba(72, 149, 239, 0.78)';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 34);
      ctx.quadraticCurveTo(x - 10, y - 50, x + flicker * 0.5, y - 64 - flicker);
      ctx.quadraticCurveTo(x + 10, y - 50, x + 5, y - 34);
      ctx.closePath();
      ctx.fill();

      // Cono interno reductor (celeste brillante)
      ctx.fillStyle = 'rgba(123, 223, 242, 0.95)';
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 34);
      ctx.lineTo(x + flicker * 0.2, y - 49);
      ctx.lineTo(x + 3, y - 34);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Dibuja una llave de paso de vidrio esmerilado (abierta o cerrada)
   */
  function drawStopcock(ctx, x, y, isOpen, label = '') {
    ctx.save();
    // Cuerpo de la llave
    ctx.fillStyle = '#33415c';
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mariposa / vástago indicando paso
    ctx.strokeStyle = isOpen ? '#06d6a0' : '#ff5964';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (isOpen) {
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x + 9, y);
    } else {
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x, y + 9);
    }
    ctx.stroke();

    if (label) {
      ctx.fillStyle = isOpen ? '#06d6a0' : '#ff5964';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y - 12);
    }
    ctx.restore();
  }

  /**
   * Dibuja una balanza analítica de precisión en el Canvas
   */
  function drawAnalyticalBalance(ctx, x, y, massStr, titleLabel, contentMode = 'none') {
    ctx.save();
    // Cabina cortavientos de vidrio
    ctx.fillStyle = 'rgba(168, 218, 220, 0.12)';
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 52, y - 118, 104, 82);
    ctx.strokeRect(x - 52, y - 118, 104, 82);

    // Platillo metálico
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(x - 32, y - 46, 64, 4);
    ctx.fillRect(x - 4, y - 42, 8, 6);

    // Objeto sobre el platillo
    if (contentMode === 'ampolla_vacia' || contentMode === 'ampolla_co2' || contentMode === 'ampolla_agua') {
      ctx.beginPath();
      ctx.arc(x, y - 74, 24, 0, Math.PI * 2);
      if (contentMode === 'ampolla_agua') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      } else if (contentMode === 'ampolla_co2') {
        ctx.fillStyle = 'rgba(167, 243, 208, 0.28)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      }
      ctx.fill();
      ctx.strokeStyle = '#f1faee';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Llaves laterales de la ampolla Regnault
      drawStopcock(ctx, x - 29, y - 74, false);
      drawStopcock(ctx, x + 29, y - 74, false);
    } else if (contentMode === 'capilar_vm') {
      // Microampolla de Víctor Meyer
      ctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
      ctx.beginPath();
      ctx.arc(x, y - 54, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 61);
      ctx.lineTo(x, y - 73);
      ctx.stroke();
    }

    // Cuerpo inferior de la balanza
    drawPixelBox(ctx, x - 58, y - 36, 116, 36, '#1f2937', '#adb5bd', 2);

    // Visor digital retroiluminado
    drawPixelBox(ctx, x - 44, y - 29, 88, 22, '#091e1a', '#06d6a0', 1.5);
    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(massStr, x + 38, y - 18);

    if (titleLabel) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(titleLabel, x, y - 126);
    }
    ctx.restore();
  }

  /**
   * Graficador científico en Canvas para rectas, curvas e interpolaciones
   */
  function drawScientificPlot(ctx, cfg) {
    ctx.save();
    const x0 = cfg.x || 55;
    const y0 = cfg.y || 45;
    const pw = cfg.width || 450;
    const ph = cfg.height || 195;

    // Fondo del área de gráfico
    drawPixelBox(ctx, x0, y0, pw, ph, '#0d1321', '#4a5568', 2);

    const minX = cfg.minX !== undefined ? cfg.minX : 0;
    const maxX = cfg.maxX !== undefined ? cfg.maxX : 10;
    const minY = cfg.minY !== undefined ? cfg.minY : 0;
    const maxY = cfg.maxY !== undefined ? cfg.maxY : 10;

    function toPxX(v) {
      return x0 + ((v - minX) / Math.max(1e-9, maxX - minX)) * pw;
    }
    function toPxY(v) {
      return y0 + ph - ((v - minY) / Math.max(1e-9, maxY - minY)) * ph;
    }

    // Grilla interna
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const nGridX = cfg.gridX || 5;
    const nGridY = cfg.gridY || 4;

    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px monospace';

    for (let i = 0; i <= nGridX; i++) {
      const valX = minX + (i / nGridX) * (maxX - minX);
      const px = toPxX(valX);
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y0 + ph);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(valX.toFixed(cfg.decimalsX !== undefined ? cfg.decimalsX : 1), px, y0 + ph + 13);
    }

    for (let j = 0; j <= nGridY; j++) {
      const valY = minY + (j / nGridY) * (maxY - minY);
      const py = toPxY(valY);
      ctx.beginPath();
      ctx.moveTo(x0, py);
      ctx.lineTo(x0 + pw, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(valY.toFixed(cfg.decimalsY !== undefined ? cfg.decimalsY : 2), x0 - 6, py + 3);
    }

    // Eje Y=0 o X=0 si está en rango
    if (minY < 0 && maxY > 0) {
      const py0 = toPxY(0);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x0, py0);
      ctx.lineTo(x0 + pw, py0);
      ctx.stroke();
    }
    if (minX < 0 && maxX > 0) {
      const px0 = toPxX(0);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
      ctx.beginPath();
      ctx.moveTo(px0, y0);
      ctx.lineTo(px0, y0 + ph);
      ctx.stroke();
    }

    // Curva continua teórica o ajuste si existe
    if (typeof cfg.curveFn === 'function') {
      ctx.strokeStyle = cfg.curveColor || '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= 120; s++) {
        const vx = minX + (s / 120) * (maxX - minX);
        const vy = cfg.curveFn(vx);
        if (vy >= minY && vy <= maxY) {
          const px = toPxX(vx);
          const py = toPxY(vy);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
    }

    // Curva secundaria de comparación (ej. qué pasa si cambia m, T, V o el gas en parciales)
    if (typeof cfg.compareCurveFn === 'function') {
      ctx.save();
      ctx.strokeStyle = cfg.compareCurveColor || '#ff5964';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= 120; s++) {
        const vx = minX + (s / 120) * (maxX - minX);
        const vy = cfg.compareCurveFn(vx);
        if (vy >= minY && vy <= maxY) {
          const px = toPxX(vx);
          const py = toPxY(vy);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }
    if (Array.isArray(cfg.extraLines)) {
      cfg.extraLines.forEach(line => {
        ctx.save();
        ctx.strokeStyle = line.color || '#ff9f1c';
        ctx.lineWidth = line.width || 1.8;
        if (line.dashed) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toPxX(line.x1), toPxY(line.y1));
        ctx.lineTo(toPxX(line.x2), toPxY(line.y2));
        ctx.stroke();
        ctx.restore();
      });
    }

    // Puntos experimentales
    if (Array.isArray(cfg.points)) {
      cfg.points.forEach(pt => {
        const px = toPxX(pt.x);
        const py = toPxY(pt.y);
        if (px >= x0 - 4 && px <= x0 + pw + 4 && py >= y0 - 4 && py <= y0 + ph + 4) {
          ctx.fillStyle = pt.color || '#06d6a0';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0b0e17';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
    }

    // Títulos de ejes
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    if (cfg.title) {
      ctx.fillText(cfg.title, x0 + pw / 2, y0 - 10);
    }
    if (cfg.xLabel) {
      ctx.fillStyle = '#7bdff2';
      ctx.fillText(cfg.xLabel, x0 + pw / 2, y0 + ph + 27);
    }
    if (cfg.yLabel) {
      ctx.save();
      ctx.translate(16, y0 + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#7bdff2';
      ctx.fillText(cfg.yLabel, 0, 0);
      ctx.restore();
    }

    // Cuadro lateral de resumen
    if (Array.isArray(cfg.summaryLines)) {
      const sx = x0 + pw + 14;
      const sw = (cfg.totalWidth || 760) - sx - 14;
      if (sw > 110) {
        drawPixelBox(ctx, sx, y0, sw, ph, '#161d2f', '#ffd166', 2);
        ctx.textAlign = 'left';
        let ty = y0 + 20;
        cfg.summaryLines.forEach(item => {
          ctx.fillStyle = item.color || '#f8f9fa';
          ctx.font = item.bold ? 'bold 11px monospace' : '10.5px monospace';
          ctx.fillText(item.text, sx + 10, ty);
          ty += item.gap || 17;
        });
      }
    }

    ctx.restore();
  }

  /**
   * Evalúa una expresión matemática ingresada en la calculadora científica de bolsillo
   */
  function safeEvalMath(exprStr) {
    if (!exprStr || !String(exprStr).trim()) return null;
    try {
      let cleaned = String(exprStr)
        .replace(/,/g, '.')
        .replace(/pi/gi, 'Math.PI')
        .replace(/sqrt\(/gi, 'Math.sqrt(')
        .replace(/ln\(/gi, 'Math.log(')
        .replace(/\^/g, '**');
      if (!/^[0-9+\-*/().\sMathPIsqrtlog*]+$/.test(cleaned)) {
        return null;
      }
      const val = Function('"use strict"; return (' + cleaned + ')')();
      return typeof val === 'number' && isFinite(val) ? val : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Diagnostica el valor numérico calculado por el estudiante frente al valor esperado
   */
  function diagnoseNumericAnswer(studentVal, targetVal, relTol = 0.018, absTol = 0.02) {
    const numVal = typeof studentVal === 'number' ? studentVal : safeEvalMath(studentVal);
    if (typeof numVal !== 'number' || isNaN(numVal)) {
      return { ok: false, msg: 'Ingresá un valor numérico válido (podés usar punto, coma decimal o una cuenta directa).' };
    }
    const diff = Math.abs(numVal - targetVal);
    const maxAllowed = Math.max(absTol, Math.abs(targetVal) * relTol);
    if (diff <= maxAllowed) {
      return { ok: true, msg: `✓ ¡Correcto! (Valor exacto: ${targetVal.toFixed(targetVal !== 0 && Math.abs(targetVal) < 1 ? 4 : 2)})` };
    }

    // Diagnóstico de errores frecuentes de unidades o signos
    if (Math.abs(targetVal) > 1e-5) {
      if (Math.abs(numVal + targetVal) <= maxAllowed) {
        return { ok: false, msg: '⚠ ¡Cuidado con el signo! Revisá el sentido físico (ej. reacción exotérmica ΔH < 0, o signo de Δh).' };
      }
      const ratio = Math.abs(numVal / targetVal);
      if (ratio > 950 && ratio < 1050) {
        return { ok: false, msg: '⚠ Revisá las unidades: tu resultado está multiplicado por 1000 (fijate el pasaje entre mL y L, o entre cal y kcal).' };
      }
      if (ratio > 0.00095 && ratio < 0.00105) {
        return { ok: false, msg: '⚠ Revisá las unidades: tu resultado está dividido por 1000 (fijate el pasaje entre mL y L, o entre g y mg).' };
      }
      if (ratio > 740 && ratio < 780 || (ratio > 1 / 780 && ratio < 1 / 740)) {
        return { ok: false, msg: '⚠ Revisá la conversión de presión: recordá que 1 atm = 760 mmHg (760 torr).' };
      }
    }

    return {
      ok: false,
      msg: `⚠ Revisá el cálculo (tu valor: ${Number(numVal.toPrecision(5))}; revisá la fórmula y los datos experimentales).`
    };
  }

  /**
   * Renderiza una mesa de trabajo de cálculos interactivos donde el alumno calcula y verifica cada magnitud
   */
  function renderCalcWorkbench(container, cfg) {
    if (!container) return;
    if (!cfg || !Array.isArray(cfg.fields) || cfg.fields.length === 0) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    container.classList.remove('hidden');
    const solvedMap = cfg.solvedMap || {};

    // Preservar valores que el usuario haya escrito pero aún no haya verificado
    cfg.fields.forEach(f => {
      const existingInput = document.getElementById(`calc-in-${f.id}`);
      if (existingInput && !solvedMap[f.id] && existingInput.value.trim() !== '') {
        f.lastInput = existingInput.value;
      }
    });
    const existingMiniCalc = document.getElementById('mini-calc-input');
    const prevMiniVal = existingMiniCalc ? existingMiniCalc.value : '';
    const existingMiniOut = document.getElementById('mini-calc-output');
    const prevMiniOut = existingMiniOut ? existingMiniOut.textContent : 'Resultado: ---';

    let html = `
      <div class="calc-header">
        <span class="calc-header-title">🧮 ${cfg.title || 'MESA DE CÁLCULOS DEL ESTUDIANTE'}</span>
        <div>
          ${cfg.showAutoSolve ? '<button type="button" class="teacher-mini-btn" id="btn-calc-autosolve">⚡ Resolver y Explicar Cálculos</button>' : ''}
        </div>
      </div>
    `;

    if (cfg.dataStripHtml) {
      html += `<div class="calc-data-strip">${cfg.dataStripHtml}</div>`;
    }

    // Calculadora Científica Integrada
    html += `
      <div class="mini-calc-bar">
        <span>🖩 <strong>Calculadora Rápida:</strong></span>
        <input type="text" id="mini-calc-input" class="mini-calc-expr" value="${prevMiniVal.replace(/"/g, '&quot;')}" placeholder="Escribí una cuenta, ej: (186.14 - 185.23) / 0.5015 o 758/760 y presioná Enter" />
        <button type="button" id="mini-calc-btn" class="teacher-mini-btn">= Calcular</button>
        <span id="mini-calc-output" class="mini-calc-res">${prevMiniOut}</span>
      </div>
    `;

    html += `<div class="calc-grid">`;
    cfg.fields.forEach(f => {
      const isSolved = Boolean(solvedMap[f.id]);
      const valStr = isSolved && f.targetValue !== undefined
        ? Number(f.targetValue).toFixed(f.decimals !== undefined ? f.decimals : 3)
        : (f.lastInput !== undefined ? f.lastInput : '');

      html += `
        <div class="calc-item ${isSolved ? 'solved' : ''}" id="calc-card-${f.id}">
          <div class="calc-item-label">
            <span>${f.label}</span>
            <span>${isSolved ? '✅ Verificado' : '⏳ Pendiente'}</span>
          </div>
          <div class="calc-item-formula">${f.formulaHint || ''}</div>
          <div class="calc-input-row">
            <input type="text" id="calc-in-${f.id}" class="calc-num-input" value="${valStr}" placeholder="Tu resultado" ${isSolved ? 'disabled' : ''} />
            <span class="calc-unit">${f.unit || ''}</span>
            <button type="button" class="calc-verify-btn" data-field-id="${f.id}" ${isSolved ? 'disabled' : ''}>
              ${isSolved ? 'OK' : 'Verificar'}
            </button>
          </div>
          <div class="calc-feedback ${isSolved ? 'ok' : ''}" id="calc-fb-${f.id}">
            ${isSolved ? `✓ Valor verificado: ${Number(f.targetValue).toFixed(f.decimals !== undefined ? f.decimals : 3)} ${f.unit || ''}` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    container.innerHTML = html;

    // Eventos de la mini calculadora
    const calcIn = document.getElementById('mini-calc-input');
    const calcBtn = document.getElementById('mini-calc-btn');
    const calcOut = document.getElementById('mini-calc-output');
    const runMiniCalc = () => {
      const res = safeEvalMath(calcIn.value);
      if (res === null) {
        calcOut.textContent = 'Expresión inválida';
        calcOut.style.color = '#ff5964';
      } else {
        calcOut.textContent = `= ${Number(res.toPrecision(6))}`;
        calcOut.style.color = '#06d6a0';
      }
    };
    if (calcBtn && calcIn) {
      calcBtn.addEventListener('click', runMiniCalc);
      calcIn.addEventListener('keydown', e => {
        if (e.key === 'Enter') runMiniCalc();
      });
    }

    // Eventos de verificación de cada campo
    cfg.fields.forEach(f => {
      const btn = container.querySelector(`.calc-verify-btn[data-field-id="${f.id}"]`);
      const inputEl = document.getElementById(`calc-in-${f.id}`);
      const fbEl = document.getElementById(`calc-fb-${f.id}`);
      const cardEl = document.getElementById(`calc-card-${f.id}`);

      const verifyField = () => {
        if (!inputEl || solvedMap[f.id]) return;
        const num = safeEvalMath(inputEl.value);
        f.lastInput = inputEl.value;
        const diag = diagnoseNumericAnswer(num, f.targetValue, f.relTol || 0.018, f.absTol || 0.02);

        if (diag.ok) {
          solvedMap[f.id] = true;
          if (window.AudioEngine) window.AudioEngine.playRecordPoint();
          if (typeof cfg.onFieldSolved === 'function') {
            cfg.onFieldSolved(f.id, f.targetValue);
          }
          renderCalcWorkbench(container, cfg);
          const allDone = cfg.fields.every(item => Boolean(solvedMap[item.id]));
          if (allDone && typeof cfg.onAllSolved === 'function') {
            cfg.onAllSolved();
          }
        } else {
          if (window.AudioEngine) window.AudioEngine.playError();
          cardEl.classList.add('error');
          fbEl.className = 'calc-feedback err';
          fbEl.textContent = f.customErrorHint ? `${diag.msg} (${f.customErrorHint})` : diag.msg;
        }
      };

      if (btn) btn.addEventListener('click', verifyField);
      if (inputEl) {
        inputEl.addEventListener('keydown', e => {
          if (e.key === 'Enter') verifyField();
        });
      }
    });

    const autoBtn = document.getElementById('btn-calc-autosolve');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        cfg.fields.forEach(f => {
          solvedMap[f.id] = true;
          if (typeof cfg.onFieldSolved === 'function') {
            cfg.onFieldSolved(f.id, f.targetValue);
          }
        });
        if (window.AudioEngine) window.AudioEngine.playFanfare();
        renderCalcWorkbench(container, cfg);
        if (typeof cfg.onAllSolved === 'function') {
          cfg.onAllSolved();
        }
      });
    }
  }

  return {
    CONSTANTS: CONSTANTS,
    CHARACTERS: CHARACTERS,
    getWaterDensity: getWaterDensity,
    getWaterVaporPressureTorr: getWaterVaporPressureTorr,
    linearRegression: linearRegression,
    nextTick: nextTick,
    getTick: getTick,
    drawPixelBox: drawPixelBox,
    drawLabBackground: drawLabBackground,
    drawPortrait: drawPortrait,
    drawBunsen: drawBunsen,
    drawStopcock: drawStopcock,
    drawAnalyticalBalance: drawAnalyticalBalance,
    drawScientificPlot: drawScientificPlot,
    safeEvalMath: safeEvalMath,
    diagnoseNumericAnswer: diagnoseNumericAnswer,
    renderCalcWorkbench: renderCalcWorkbench
  };
})();
