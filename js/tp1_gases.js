/**
 * tp1_gases.js
 * Trabajo Práctico 1: Comportamiento y Leyes de los Gases (Guía IQ 2019, Págs. 36-39)
 * Incluye:
 * - Barómetro de Fortín (enrase en punta de marfil y lectura de Patm)
 * - Experiencia 1: Ley de Boyle-Mariotte (P vs V, PV vs V, PV² vs V)
 * - Experiencia 2: Ley de Charles y Gay-Lussac (P vs t a V constante y extrapolación a -273.15 °C)
 * - Experiencia 3: Ley de Difusión de Graham (NH3 + HCl -> NH4Cl sólido)
 */

window.TP1_Gases = (function () {
  const TUBE_RADIUS_CM = 0.50; // r = 0.50 cm -> Area = 0.7854 cm²
  const TUBE_AREA_CM2 = Math.PI * TUBE_RADIUS_CM * TUBE_RADIUS_CM;
  const GRAHAM_TUBE_LEN_CM = 60.0;
  const MW_NH3 = 17.031;
  const MW_HCL = 36.461;

  function createInitialState() {
    return {
      stage: 'fortin', // 'fortin' | 'boyle' | 'boyle_graphs' | 'gay_lussac' | 'gl_graph' | 'graham' | 'quiz' | 'done'
      patmMmHg: 758.0,
      tempAmbC: 22.0,
      score: 0,
      maxScore: 100,

      // Barómetro de Fortín
      fortinScrewOffsetMm: -2.4, // Debe llevarse a 0.0 (±0.2) para tocar la punta de marfil
      fortinCalibrated: false,

      // Experiencia 1: Boyle-Mariotte
      // Gas encerrado tal que a Patm (758 mmHg), L0 = 18.0 cm -> V0 = 14.14 mL
      boyleBranchShiftCm: 0.0, // desplazamiento de la rama móvil (-16 a +24 cm)
      boyleRows: [],
      boyleGraphType: 'P_vs_V', // 'P_vs_V' | 'PV_vs_V' | 'PV2_vs_V'

      // Experiencia 2: Gay-Lussac (Volumen constante)
      glBathTempC: 22.0,
      glBurnerOn: false,
      glManometerAdjustMm: 0.0, // Ajuste de la rama libre para enrasar el aforo
      glEnrasado: true,
      glRows: [],

      // Experiencia 3: Difusión de Graham
      grahamRunning: false,
      grahamProgress: 0.0, // 0 a 1
      grahamRingFormed: false,
      grahamMeasured: false,
      dNH3_cm: 35.65,
      dHCl_cm: 24.35,

      // Quiz conceptual
      quizStep: 0,
      quizAnswered: false,

      // Estado de cálculos resueltos por el alumno
      calcSolved: {
        fortin_patm_atm: false,
        boyle_dh: false,
        boyle_vol: false,
        boyle_pgas: false,
        boyle_pv: false,
        gl_tk: false,
        gl_pgas: false,
        gl_tzero: false,
        graham_dhcl: false,
        graham_rexp: false,
        graham_rteo: false
      }
    };
  }

  let state = createInitialState();

  /**
   * Calcula las variables de equilibrio en la rama cerrada y abierta para Boyle-Mariotte
   */
  function computeBoyleEquilibrium(st) {
    const p0_mmHg = st.patmMmHg;
    const L0_cm = 18.0; // longitud de columna de gas cuando delta_h = 0
    // Al mover la rama abierta, generamos una diferencia de altura delta_h en cm de Hg
    const deltaH_cm = st.boyleBranchShiftCm;
    const deltaH_mmHg = deltaH_cm * 10.0;
    const pGas_mmHg = Math.max(250, p0_mmHg + deltaH_mmHg);
    const pGas_atm = pGas_mmHg / 760.0;

    // Por ley de Boyle: P0 * L0 = Pgas * L
    const L_cm = (p0_mmHg * L0_cm) / pGas_mmHg;
    const V_mL = TUBE_AREA_CM2 * L_cm;

    // Alturas desde la mesada (nivel de referencia)
    // Tope superior de la rama cerrada está fijo a 42.0 cm de la mesada
    const topClosedCm = 42.0;
    const hC_cm = topClosedCm - L_cm;
    const hA_cm = hC_cm + deltaH_cm;

    const PV = pGas_atm * V_mL;
    const PV2 = pGas_atm * V_mL * V_mL;

    return {
      L_cm,
      hA_cm,
      hC_cm,
      deltaH_cm,
      deltaH_mmHg,
      V_mL,
      pGas_mmHg,
      pGas_atm,
      PV,
      PV2
    };
  }

  /**
   * Calcula el estado del termómetro de gas a volumen constante (Gay-Lussac)
   */
  function computeGayLussacState(st) {
    const T0_K = st.tempAmbC + 273.15;
    const T_K = st.glBathTempC + 273.15;
    // Presión verdadera del gas si el volumen se mantiene en el aforo: P(T) = P0 * (T / T0)
    const pTarget_mmHg = st.patmMmHg * (T_K / T0_K);
    const deltaHTarget_mm = pTarget_mmHg - st.patmMmHg; // diferencia de altura requerida en mmHg

    // Error de enrase según dónde puso el jugador la rama móvil
    const diffEnraseMm = st.glManometerAdjustMm - deltaHTarget_mm;
    const isEnrasado = Math.abs(diffEnraseMm) <= 2.5;

    const deltaH_cm = st.glManometerAdjustMm / 10.0;
    const hC_cm = 20.0 - Math.max(-4, Math.min(4, diffEnraseMm * 0.08)); // Marca de aforo en 20.0 cm
    const hA_cm = hC_cm + deltaH_cm;
    const pMeasured_mmHg = st.patmMmHg + st.glManometerAdjustMm;
    const pMeasured_atm = pMeasured_mmHg / 760.0;

    return {
      T_K,
      pTarget_mmHg,
      deltaHTarget_mm,
      diffEnraseMm,
      isEnrasado,
      hC_cm,
      hA_cm,
      deltaH_cm,
      pMeasured_mmHg,
      pMeasured_atm
    };
  }

  /**
   * Renderiza la escena activa en el Canvas de 760x300
   */
  function renderScene(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const tick = window.LabCommon.nextTick();

    // Si estamos en vista de gráficos, delegamos al graficador
    if (state.stage === 'boyle_graphs') {
      renderBoyleGraphs(ctx, w, h);
      return;
    }
    if (state.stage === 'gl_graph') {
      renderGayLussacGraph(ctx, w, h);
      return;
    }

    let banner = 'TP 1: COMPORTAMIENTO Y LEYES DE LOS GASES';
    if (state.stage === 'fortin') banner = 'BARÓMETRO DE FORTÍN — MEDICIÓN DE PRESIÓN ATMOSFÉRICA';
    else if (state.stage === 'boyle') banner = 'EXPERIENCIA 1: LEY DE BOYLE-MARIOTTE (T = constante)';
    else if (state.stage === 'gay_lussac') banner = 'EXPERIENCIA 2: LEY DE CHARLES Y GAY-LUSSAC (V = constante)';
    else if (state.stage === 'graham') banner = 'EXPERIENCIA 3: LEY DE DIFUSIÓN DE GRAHAM (NH₃ + HCl)';

    window.LabCommon.drawLabBackground(ctx, w, h, banner);

    if (state.stage === 'fortin') {
      renderFortinScene(ctx, w, h);
    } else if (state.stage === 'boyle') {
      renderBoyleScene(ctx, w, h);
    } else if (state.stage === 'gay_lussac') {
      renderGayLussacScene(ctx, w, h, tick);
    } else if (state.stage === 'graham' || state.stage === 'quiz' || state.stage === 'done') {
      renderGrahamScene(ctx, w, h, tick);
    }
  }

  function renderFortinScene(ctx, w, h) {
    // Dibujo del Barómetro de Fortín a la izquierda y lupa de la cubeta + Vernier a la derecha
    const bx = 165;
    // Columna de latón protectora
    window.LabCommon.drawPixelBox(ctx, bx - 14, 48, 28, 210, '#8d6e63', '#ffd166', 2);
    // Tubo de vidrio central
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(bx - 5, 58, 10, 175);

    // Cubeta inferior (e) con tornillo de ajuste (k)
    window.LabCommon.drawPixelBox(ctx, bx - 26, 215, 52, 42, '#374151', '#cbd5e0', 2);
    // Mercurio en cubeta
    const hgLevelY = 236 - state.fortinScrewOffsetMm * 2.2;
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(bx - 22, hgLevelY, 44, 254 - hgLevelY);

    // Tornillo inferior
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(bx - 6, 257, 12, 14);
    ctx.fillRect(bx - 16, 267, 32, 5);

    // Lupa de Enrase de la Punta de Marfil (Centro)
    const cx = 395, cy = 155, r = 74;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1321';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = Math.abs(state.fortinScrewOffsetMm) <= 0.25 ? '#06d6a0' : '#ffd166';
    ctx.stroke();
    ctx.clip();

    // Interior de la lupa: Punta de marfil fija (apuntando hacia abajo en cy)
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 55);
    ctx.lineTo(cx + 10, cy - 55);
    ctx.lineTo(cx, cy); // Ápice de la punta de marfil en Y = cy
    ctx.closePath();
    ctx.fill();

    // Superficie del mercurio y reflejo virtual de la punta
    const meniscoY = cy - state.fortinScrewOffsetMm * 10.0;
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.moveTo(cx - r, meniscoY + 6);
    ctx.quadraticCurveTo(cx, meniscoY - 4, cx + r, meniscoY + 6);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();

    // Imagen reflejada de la punta de marfil en el mercurio
    ctx.fillStyle = 'rgba(254, 250, 224, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 9, meniscoY + 45);
    ctx.lineTo(cx + 9, meniscoY + 45);
    ctx.lineTo(cx, meniscoY);
    ctx.closePath();
    ctx.fill();

    // Línea de referencia horizontal del cero
    ctx.strokeStyle = 'rgba(6, 214, 160, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LUPA: CUBETA Y PUNTA DE MARFIL', cx, 66);

    const aligned = Math.abs(state.fortinScrewOffsetMm) <= 0.25;
    ctx.fillStyle = aligned ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      aligned ? '★ ENRASE CORRECTO (Punta = Reflejo)' : `Desnivel: ${state.fortinScrewOffsetMm.toFixed(1)} mm`,
      cx,
      248
    );

    // Panel derecho: Lectura de Escala y Nonio
    window.LabCommon.drawPixelBox(ctx, 520, 62, 215, 185, '#161e2e', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LECTURA BAROMÉTRICA:', 534, 86);

    const readMistake = aligned ? 0 : state.fortinScrewOffsetMm;
    const apparentP = state.patmMmHg + readMistake;

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`T ambiente:  ${state.tempAmbC.toFixed(1)} °C`, 534, 114);
    ctx.fillText(`Lectura Hg:  ${apparentP.toFixed(1)} mmHg`, 534, 136);
    ctx.fillStyle = state.calcSolved.fortin_patm_atm ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `Equiv. atm:  ${state.calcSolved.fortin_patm_atm ? (apparentP / 760).toFixed(4) + ' atm' : '[ ? Calcular ]'}`,
      534,
      158
    );
    ctx.fillStyle = '#f8f9fa';
    ctx.fillText(`Diám. tubo:  12.0 mm`, 534, 180);

    ctx.fillStyle = aligned && state.calcSolved.fortin_patm_atm ? '#06d6a0' : '#ff5964';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      !aligned
        ? '1° Ajustá tornillo a 0.0 mm'
        : !state.calcSolved.fortin_patm_atm
        ? '2° Calculá P_atm en atm abajo'
        : '★ LISTO PARA AVANZAR ★',
      534,
      215
    );
  }

  function renderBoyleScene(ctx, w, h) {
    const eq = computeBoyleEquilibrium(state);

    // Soporte vertical de hierro y regla milimetrada
    const baseX = 270;
    const benchY = h - 62;
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(baseX - 65, benchY - 6, 130, 6);
    ctx.fillRect(baseX - 4, 48, 8, benchY - 48);

    // Regla graduada central (0 a 50 cm, donde 1 cm = 3.4 px)
    const scalePxPerCm = 3.4;
    const yZero = benchY - 8;
    window.LabCommon.drawPixelBox(ctx, baseX + 10, 48, 24, yZero - 48, '#fefae0', '#6c757d', 1);
    ctx.fillStyle = '#1f2937';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    for (let cm = 0; cm <= 50; cm += 5) {
      const yCm = yZero - cm * scalePxPerCm;
      if (yCm >= 50) {
        ctx.fillRect(baseX + 10, yCm, cm % 10 === 0 ? 8 : 5, 1);
        if (cm % 10 === 0) {
          ctx.fillText(`${cm}`, baseX + 19, yCm + 3);
        }
      }
    }

    // Posiciones en píxeles de la rama cerrada (izquierda) y rama abierta móvil (derecha)
    const xClosed = baseX - 32;
    const xOpen = baseX + 58;
    const yTopClosed = yZero - 42.0 * scalePxPerCm;
    const yHc = yZero - eq.hC_cm * scalePxPerCm;
    const yHa = yZero - eq.hA_cm * scalePxPerCm;

    // Manguera flexible en U conectando ambas ramas por debajo
    const uBottomY = Math.min(benchY - 4, Math.max(yHc, yHa) + 28);
    ctx.strokeStyle = '#9aa5b1';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(xClosed, yHc);
    ctx.lineTo(xClosed, uBottomY - 10);
    ctx.quadraticCurveTo((xClosed + xOpen) / 2, uBottomY + 14, xOpen, uBottomY - 10);
    ctx.lineTo(xOpen, yHa);
    ctx.stroke();

    // Rama cerrada de vidrio (contiene el gas confinado arriba y mercurio abajo)
    ctx.fillStyle = 'rgba(123, 223, 242, 0.20)'; // Gas confinado (longitud L)
    ctx.fillRect(xClosed - 7, yTopClosed, 14, yHc - yTopClosed);

    // Mercurio en rama cerrada
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(xClosed - 6, yHc, 12, uBottomY - 10 - yHc);

    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.strokeRect(xClosed - 7, yTopClosed, 14, uBottomY - 10 - yTopClosed);

    // Rama abierta de vidrio (derecha)
    const yTopOpen = Math.max(46, yHa - 38);
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(xOpen - 6, yHa, 12, uBottomY - 10 - yHa);
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOpen - 7, yTopOpen);
    ctx.lineTo(xOpen - 7, uBottomY - 10);
    ctx.moveTo(xOpen + 7, yTopOpen);
    ctx.lineTo(xOpen + 7, uBottomY - 10);
    ctx.stroke();

    // Indicadores visuales de L, h_C, h_A y Delta h
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xClosed - 16, yTopClosed);
    ctx.lineTo(xClosed - 16, yHc);
    ctx.stroke();
    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`L=${eq.L_cm.toFixed(2)}cm`, xClosed - 20, (yTopClosed + yHc) / 2 + 3);

    // Líneas punteadas de nivel de mercurio (Puntos 1 y 2 de igual presión hidrostática)
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(xClosed, yHc);
    ctx.lineTo(xOpen + 24, yHc);
    ctx.moveTo(xOpen, yHa);
    ctx.lineTo(xOpen + 24, yHa);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.fillText(`Δh = ${eq.deltaH_cm >= 0 ? '+' : ''}${eq.deltaH_cm.toFixed(1)} cm Hg`, xOpen + 28, (yHc + yHa) / 2 + 3);

    // Panel de Lecturas en Tiempo Real (Derecha)
    window.LabCommon.drawPixelBox(ctx, 455, 52, 285, 180, '#161e2e', '#ffd166', 2);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('MEDICIÓN BOYLE-MARIOTTE:', 468, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`Radio tubo (r):   ${TUBE_RADIUS_CM.toFixed(2)} cm`, 468, 94);
    ctx.fillText(`Long. gas (L):    ${eq.L_cm.toFixed(2)} cm`, 468, 112);
    ctx.fillStyle = state.calcSolved.boyle_vol ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `Volumen (V=πr²L): ${state.calcSolved.boyle_vol ? eq.V_mL.toFixed(2) + ' mL' : '[ ? Calcular abajo ]'}`,
      468,
      130
    );
    ctx.fillStyle = '#f8f9fa';
    ctx.fillText(`h_A / h_C:        ${eq.hA_cm.toFixed(1)} / ${eq.hC_cm.toFixed(1)} cm`, 468, 148);
    ctx.fillStyle = state.calcSolved.boyle_dh ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `Δh = h_A - h_C:   ${state.calcSolved.boyle_dh ? eq.deltaH_mmHg.toFixed(1) + ' mmHg' : '[ ? Calcular abajo ]'}`,
      468,
      166
    );
    ctx.fillStyle = state.calcSolved.boyle_pgas ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `P_gas = Patm+Δh:  ${state.calcSolved.boyle_pgas ? eq.pGas_atm.toFixed(4) + ' atm' : '[ ? Calcular abajo ]'}`,
      468,
      186
    );
    ctx.fillStyle = state.calcSolved.boyle_pv ? '#7bdff2' : '#ff9f1c';
    ctx.fillText(
      `Producto P·V:     ${state.calcSolved.boyle_pv ? eq.PV.toFixed(2) + ' atm·mL' : '[ ? Calcular abajo ]'}`,
      468,
      206
    );
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(`Puntos anotados:  ${state.boyleRows.length} / 8 mín.`, 468, 224);
  }

  function renderBoyleGraphs(ctx, w, h) {
    window.LabCommon.drawLabBackground(ctx, w, h, 'ANÁLISIS GRÁFICO — LEY DE BOYLE-MARIOTTE', 22);
    const rows = state.boyleRows.length > 0 ? state.boyleRows : generateIdealBoyleSample();

    let points = [];
    let title = '';
    let xLabel = 'Volumen V (mL)';
    let yLabel = '';
    let minY = 0, maxY = 2;
    let curveFn = null;

    const minV = Math.min(...rows.map(r => r.V_mL)) * 0.9;
    const maxV = Math.max(...rows.map(r => r.V_mL)) * 1.08;
    const avgPV = rows.reduce((acc, r) => acc + r.PV, 0) / rows.length;

    if (state.boyleGraphType === 'P_vs_V') {
      title = 'GRÁFICO 1: Presión P (atm) vs. Volumen V (mL)';
      yLabel = 'P (atm)';
      points = rows.map(r => ({ x: r.V_mL, y: r.pGas_atm, color: '#06d6a0' }));
      minY = 0.5;
      maxY = 1.6;
      curveFn = v => avgPV / Math.max(1, v);
    } else if (state.boyleGraphType === 'PV_vs_V') {
      title = 'GRÁFICO 2: Producto P·V (atm·mL) vs. V (mL)';
      yLabel = 'P·V (atm·mL)';
      points = rows.map(r => ({ x: r.V_mL, y: r.PV, color: '#7bdff2' }));
      minY = avgPV * 0.8;
      maxY = avgPV * 1.2;
      curveFn = () => avgPV;
    } else {
      title = 'GRÁFICO 3: Producto P·V² (atm·mL²) vs. V (mL)';
      yLabel = 'P·V²';
      points = rows.map(r => ({ x: r.V_mL, y: r.PV2, color: '#ff9f1c' }));
      minY = avgPV * minV * 0.85;
      maxY = avgPV * maxV * 1.1;
      curveFn = v => avgPV * v;
    }

    window.LabCommon.drawScientificPlot(ctx, {
      x: 58,
      y: 56,
      width: 430,
      height: 185,
      minX: minV,
      maxX: maxV,
      minY: minY,
      maxY: maxY,
      title: title,
      xLabel: xLabel,
      yLabel: yLabel,
      points: points,
      curveFn: curveFn,
      decimalsX: 1,
      decimalsY: 2,
      summaryLines: [
        { text: 'CONCLUSIÓN EXPERIMENTAL:', bold: true, color: '#ffd166', gap: 20 },
        { text: `T trabajo: ${state.tempAmbC.toFixed(1)} °C`, color: '#f8f9fa' },
        { text: `P_atm:     ${state.patmMmHg.toFixed(1)} mmHg`, color: '#f8f9fa' },
        { text: `Prom. P·V: ${avgPV.toFixed(2)} atm·mL`, bold: true, color: '#06d6a0', gap: 22 },
        { text: '• P vs V: Hipérbola', color: '#cbd5e0' },
        { text: '  isotérmica.', color: '#cbd5e0' },
        { text: '• P·V vs V: Recta horiz.', color: '#7bdff2' },
        { text: '  confirma PV = cte.', color: '#7bdff2' },
        { text: '• P·V² vs V: Varía lin.', color: '#ff9f1c' },
        { text: '  con V (no es cte).', color: '#ff9f1c' }
      ]
    });
  }

  function renderGayLussacScene(ctx, w, h, tick) {
    const gl = computeGayLussacState(state);
    const benchY = h - 62;

    // Mechero y trípode a la izquierda
    const bathX = 165;
    window.LabCommon.drawBunsen(ctx, bathX, benchY, state.glBurnerOn);
    // Trípode
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bathX - 42, benchY - 65);
    ctx.lineTo(bathX + 42, benchY - 65);
    ctx.moveTo(bathX - 36, benchY - 65);
    ctx.lineTo(bathX - 42, benchY);
    ctx.moveTo(bathX + 36, benchY - 65);
    ctx.lineTo(bathX + 42, benchY);
    ctx.stroke();

    // Vaso de precipitados (baño María)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.fillRect(bathX - 36, benchY - 140, 72, 74);
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.strokeRect(bathX - 36, benchY - 142, 72, 76);

    // Ampolla de gas sumergida en el baño
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.beginPath();
    ctx.arc(bathX, benchY - 102, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();

    // Termómetro en el baño
    ctx.fillStyle = '#fefae0';
    ctx.fillRect(bathX - 26, benchY - 175, 6, 65);
    ctx.fillStyle = '#ff5964';
    const thH = ((state.glBathTempC - 10) / 90) * 52;
    ctx.fillRect(bathX - 25, benchY - 110 - thH, 4, thH);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Baño: ${state.glBathTempC.toFixed(1)} °C`, bathX, benchY - 182);

    // Tubo capilar de conexión hacia el manómetro de mercurio
    const xClosed = 285;
    const xOpen = 365;
    const aforoY = 160; // Nivel fijo que define el volumen constante
    const meniscoClosedY = aforoY - Math.max(-24, Math.min(24, gl.diffEnraseMm * 0.6));
    const meniscoOpenY = aforoY - (state.glManometerAdjustMm * 0.35);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bathX, benchY - 122);
    ctx.lineTo(bathX, 72);
    ctx.lineTo(xClosed, 72);
    ctx.lineTo(xClosed, meniscoClosedY);
    ctx.stroke();

    // Manómetro en U con mercurio
    const uBot = benchY - 12;
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(xClosed, meniscoClosedY);
    ctx.lineTo(xClosed, uBot);
    ctx.lineTo(xOpen, uBot);
    ctx.lineTo(xOpen, meniscoOpenY);
    ctx.stroke();

    // Marca de Aforo (Volumen Constante)
    ctx.strokeStyle = '#ff5964';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xClosed - 16, aforoY);
    ctx.lineTo(xClosed + 16, aforoY);
    ctx.stroke();
    ctx.fillStyle = '#ff5964';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('AFORO (V cte) ▸', xClosed - 18, aforoY + 3);

    // Panel derecho de estado e instrucciones de enrase
    window.LabCommon.drawPixelBox(ctx, 445, 52, 295, 182, '#161e2e', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TERMÓMETRO DE GAS (V = cte):', 458, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(
      `Temp. baño (t):   ${state.glBathTempC.toFixed(1)} °C (${state.calcSolved.gl_tk ? gl.T_K.toFixed(2) + ' K' : '? K'})`,
      458,
      95
    );
    ctx.fillText(`Δh rama móvil:    ${state.glManometerAdjustMm.toFixed(1)} mmHg`, 458, 115);
    ctx.fillStyle = state.calcSolved.gl_pgas ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `P_gas medida:     ${gl.pMeasured_mmHg.toFixed(1)} mmHg (${state.calcSolved.gl_pgas ? gl.pMeasured_atm.toFixed(4) + ' atm' : '? atm'})`,
      458,
      135
    );

    ctx.fillStyle = gl.isEnrasado ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      gl.isEnrasado
        ? '★ MENISCO ENRASADO EN EL AFORO'
        : `⚠ Desajuste de aforo: ${gl.diffEnraseMm > 0 ? '+' : ''}${gl.diffEnraseMm.toFixed(1)} mm`,
      458,
      162
    );

    ctx.fillStyle = '#cbd5e0';
    ctx.font = '10.5px monospace';
    ctx.fillText('Para cada T, ajustá Δh hasta que el', 458, 185);
    ctx.fillText('mercurio toque la marca de AFORO.', 458, 200);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`Medidas registradas: ${state.glRows.length} / 6 mín.`, 458, 222);
  }

  function renderGayLussacGraph(ctx, w, h) {
    window.LabCommon.drawLabBackground(ctx, w, h, 'EXTRAPOLACIÓN AL CERO ABSOLUTO — GAY-LUSSAC', 22);
    const rows = state.glRows.length >= 2 ? state.glRows : generateIdealGayLussacSample();
    const pts = rows.map(r => ({ x: r.t_C, y: r.P_atm, color: '#06d6a0' }));
    const reg = window.LabCommon.linearRegression(pts);
    const tZeroAbs = Math.abs(reg.slope) > 1e-9 ? -reg.intercept / reg.slope : -273.15;

    window.LabCommon.drawScientificPlot(ctx, {
      x: 58,
      y: 56,
      width: 430,
      height: 185,
      minX: -300,
      maxX: 100,
      minY: 0,
      maxY: 1.4,
      title: 'Presión P (atm) vs. Temperatura t (°C) — Extrapolación a P = 0',
      xLabel: 'Temperatura t (°C)',
      yLabel: 'P (atm)',
      points: pts,
      curveFn: t => reg.slope * t + reg.intercept,
      decimalsX: 0,
      decimalsY: 2,
      summaryLines: [
        { text: 'LEY DE GAY-LUSSAC:', bold: true, color: '#ffd166', gap: 20 },
        { text: `P(t) = a + b·t`, color: '#7bdff2' },
        { text: `Ordenada a: ${reg.intercept.toFixed(4)} atm`, color: '#f8f9fa' },
        { text: `Pendiente:  ${reg.slope.toFixed(5)} atm/°C`, color: '#f8f9fa' },
        { text: `R² ajuste:  ${reg.r2.toFixed(5)}`, color: '#f8f9fa', gap: 22 },
        { text: 'CERO ABSOLUTO (P → 0):', bold: true, color: '#06d6a0' },
        {
          text: state.calcSolved.gl_tzero ? `t₀ exp = ${tZeroAbs.toFixed(1)} °C` : 't₀ = [ ? Calcular abajo ]',
          bold: true,
          color: state.calcSolved.gl_tzero ? '#06d6a0' : '#ff9f1c'
        },
        { text: `Despejá t₀ = -a / b`, color: '#cbd5e0' }
      ]
    });
  }

  function renderGrahamScene(ctx, w, h, tick) {
    const benchY = h - 62;
    const tubeLeft = 110;
    const tubeRight = 650;
    const tubeW = tubeRight - tubeLeft; // 540 px = 60.0 cm (9 px/cm)
    const tubeY = 135;

    // Soportes del tubo de difusión
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(160, tubeY + 14, 8, benchY - tubeY - 14);
    ctx.fillRect(590, tubeY + 14, 8, benchY - tubeY - 14);
    ctx.fillRect(140, benchY - 6, 48, 6);
    ctx.fillRect(570, benchY - 6, 48, 6);

    // Tubo de vidrio horizontal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(tubeLeft, tubeY - 16, tubeW, 32);
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(tubeLeft, tubeY - 16, tubeW, 32);

    // Tapón izquierdo con hisopo de NH3(aq)
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(tubeLeft - 18, tubeY - 14, 18, 28);
    ctx.fillStyle = '#7bdff2';
    ctx.beginPath();
    ctx.arc(tubeLeft + 10, tubeY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NH₃ (ac)', tubeLeft, tubeY - 26);
    ctx.font = '10px monospace';
    ctx.fillText('M = 17.03 g/mol', tubeLeft, tubeY - 40);

    // Tapón derecho con hisopo de HCl(aq)
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(tubeRight, tubeY - 14, 18, 28);
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.arc(tubeRight - 10, tubeY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px monospace';
    ctx.fillText('HCl (ac)', tubeRight, tubeY - 26);
    ctx.font = '10px monospace';
    ctx.fillText('M = 36.46 g/mol', tubeRight, tubeY - 40);

    // Fracción teórica del punto de encuentro desde el extremo de NH3:
    // d_NH3 / d_HCl = sqrt(36.461 / 17.031) = 1.4633 -> frac = 1.4633 / 2.4633 = 0.59405
    const meetFrac = 0.5941;
    const meetX = tubeLeft + tubeW * meetFrac;

    if (state.grahamProgress > 0) {
      const curNH3 = tubeLeft + (meetX - tubeLeft) * state.grahamProgress;
      const curHCl = tubeRight - (tubeRight - meetX) * state.grahamProgress;

      // Nube de difusión de NH3 (izquierda -> derecha)
      const grad1 = ctx.createLinearGradient(tubeLeft, 0, curNH3, 0);
      grad1.addColorStop(0, 'rgba(123, 223, 242, 0.45)');
      grad1.addColorStop(1, 'rgba(123, 223, 242, 0.05)');
      ctx.fillStyle = grad1;
      ctx.fillRect(tubeLeft + 12, tubeY - 14, Math.max(0, curNH3 - tubeLeft - 12), 28);

      // Nube de difusión de HCl (derecha -> izquierda)
      const grad2 = ctx.createLinearGradient(curHCl, 0, tubeRight, 0);
      grad2.addColorStop(0, 'rgba(255, 159, 28, 0.05)');
      grad2.addColorStop(1, 'rgba(255, 159, 28, 0.45)');
      ctx.fillStyle = grad2;
      ctx.fillRect(curHCl, tubeY - 14, Math.max(0, tubeRight - 12 - curHCl), 28);
    }

    // Anillo blanco de NH4Cl(s) al encontrarse ambos frentes
    if (state.grahamRingFormed) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(meetX - 4, tubeY - 15, 8, 30);
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 2;
      ctx.strokeRect(meetX - 6, tubeY - 18, 12, 36);

      ctx.fillStyle = '#06d6a0';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('★ Anillo de NH₄Cl (s) ★', meetX, tubeY - 26);

      // Cotas de distancia medidas
      ctx.strokeStyle = '#7bdff2';
      ctx.beginPath();
      ctx.moveTo(tubeLeft, tubeY + 28);
      ctx.lineTo(meetX, tubeY + 28);
      ctx.stroke();
      ctx.fillStyle = '#7bdff2';
      ctx.fillText(`d(NH₃) = ${state.dNH3_cm.toFixed(2)} cm`, (tubeLeft + meetX) / 2, tubeY + 42);

      ctx.strokeStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.moveTo(meetX, tubeY + 28);
      ctx.lineTo(tubeRight, tubeY + 28);
      ctx.stroke();
      ctx.fillStyle = '#ff9f1c';
      ctx.fillText(
        state.calcSolved.graham_dhcl ? `d(HCl) = ${state.dHCl_cm.toFixed(2)} cm` : 'd(HCl) = [ ? Calcular ]',
        (meetX + tubeRight) / 2,
        tubeY + 42
      );
    }

    // Regla graduada de 60 cm debajo del tubo
    window.LabCommon.drawPixelBox(ctx, tubeLeft, tubeY + 52, tubeW, 20, '#fefae0', '#4a5568', 1);
    ctx.fillStyle = '#1f2937';
    ctx.font = '9px monospace';
    for (let cm = 0; cm <= 60; cm += 5) {
      const rx = tubeLeft + (cm / 60) * tubeW;
      ctx.fillRect(rx, tubeY + 52, 1, cm % 10 === 0 ? 8 : 4);
      if (cm % 10 === 0) {
        ctx.fillText(`${cm}`, rx, tubeY + 69);
      }
    }
  }

  function generateIdealBoyleSample() {
    const shifts = [-14, -10, -5, 0, 5, 10, 16, 22];
    return shifts.map((s, idx) => {
      const eq = computeBoyleEquilibrium({
        patmMmHg: state.patmMmHg,
        tempAmbC: state.tempAmbC,
        boyleBranchShiftCm: s
      });
      return {
        index: idx + 1,
        ...eq
      };
    });
  }

  function generateIdealGayLussacSample() {
    const temps = [22.0, 32.0, 42.0, 52.0, 62.0, 72.0];
    return temps.map((t, idx) => {
      const T0_K = state.tempAmbC + 273.15;
      const T_K = t + 273.15;
      const P_mmHg = state.patmMmHg * (T_K / T0_K);
      const deltaH_mm = P_mmHg - state.patmMmHg;
      return {
        index: idx + 1,
        t_C: t,
        T_K: T_K,
        hA_cm: 20.0 + deltaH_mm / 10.0,
        hC_cm: 20.0,
        deltaH_mm: deltaH_mm,
        P_mmHg: P_mmHg,
        P_atm: P_mmHg / 760.0
      };
    });
  }

  return {
    getState: function () {
      return state;
    },

    reset: function () {
      state = createInitialState();
    },

    renderScene: renderScene,
    computeBoyleEquilibrium: computeBoyleEquilibrium,
    computeGayLussacState: computeGayLussacState,
    generateIdealBoyleSample: generateIdealBoyleSample,
    generateIdealGayLussacSample: generateIdealGayLussacSample,

    getHudInfo: function () {
      return [
        { label: 'TP Actual:', value: '1. Leyes de los Gases' },
        { label: 'P_atm (Fortín):', value: state.fortinCalibrated ? `${state.patmMmHg.toFixed(1)} mmHg` : 'Sin enrasar' },
        { label: 'T ambiente:', value: `${state.tempAmbC.toFixed(1)} °C` },
        { label: 'Datos Boyle / G-L:', value: `${state.boyleRows.length}/8 · ${state.glRows.length}/6` },
        { label: 'Puntaje:', value: `${state.score} pts` }
      ];
    },

    getLogbookData: function () {
      const headers = ['Exp', '#', 'Var 1', 'Var 2', 'Δh (mmHg)', 'P (atm)', 'Magnitud Control'];
      const rows = [];

      state.boyleRows.forEach(r => {
        rows.push([
          'Boyle (T cte)',
          r.index,
          `L = ${r.L_cm.toFixed(2)} cm`,
          `V = ${r.V_mL.toFixed(2)} mL`,
          r.deltaH_mmHg.toFixed(1),
          r.pGas_atm.toFixed(4),
          `P·V = ${r.PV.toFixed(2)} atm·mL`
        ]);
      });

      state.glRows.forEach(r => {
        rows.push([
          'Gay-Lussac (V cte)',
          r.index,
          `t = ${r.t_C.toFixed(1)} °C`,
          `T = ${r.T_K.toFixed(2)} K`,
          r.deltaH_mm.toFixed(1),
          r.P_atm.toFixed(4),
          `P/T = ${(r.P_atm / r.T_K).toFixed(5)} atm/K`
        ]);
      });

      if (state.grahamMeasured) {
        const ratioD = state.dNH3_cm / state.dHCl_cm;
        const ratioTeo = Math.sqrt(MW_HCL / MW_NH3);
        rows.push([
          'Graham (Difusión)',
          1,
          `d(NH₃)=${state.dNH3_cm.toFixed(2)} cm`,
          `d(HCl)=${state.dHCl_cm.toFixed(2)} cm`,
          '---',
          '1.0000',
          `d₁/d₂ = ${ratioD.toFixed(3)} (Teo: ${ratioTeo.toFixed(3)})`
        ]);
      }

      return {
        title: 'Comportamiento y Leyes de los Gases',
        metaHtml: `<strong>Presión Atmosférica (Fortín):</strong> ${state.patmMmHg.toFixed(1)} mmHg (${(state.patmMmHg / 760).toFixed(4)} atm) &nbsp;|&nbsp; <strong>Temperatura Ambiente:</strong> ${state.tempAmbC.toFixed(1)} °C &nbsp;|&nbsp; <strong>Radio tubo Boyle:</strong> ${TUBE_RADIUS_CM.toFixed(2)} cm`,
        headers: headers,
        rows: rows,
        metaLines: [
          `Presión atmosférica (Barómetro de Fortín): ${state.patmMmHg.toFixed(1)} mmHg`,
          `Temperatura ambiente: ${state.tempAmbC.toFixed(1)} °C`,
          `Radio interno del tubo cerrado (Boyle): ${TUBE_RADIUS_CM.toFixed(2)} cm`
        ],
        conclusionLines: [
          `Puntos registrados en Ley de Boyle-Mariotte: ${state.boyleRows.length}`,
          `Puntos registrados en Ley de Charles y Gay-Lussac: ${state.glRows.length}`,
          `Experiencia de Difusión de Graham completada: ${state.grahamMeasured ? 'Sí (d_NH3/d_HCl = 1.464)' : 'Pendiente'}`
        ]
      };
    }
  };
})();
