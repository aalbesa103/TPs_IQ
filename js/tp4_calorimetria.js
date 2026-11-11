/**
 * tp4_calorimetria.js
 * Trabajo Práctico 4: Calorimetría — Calor de Neutralización
 * (Guía IQ 2019, Págs. 52-57)
 * Incluye:
 * - Vaso térmico adiabático (termo espejado al vacío), agitador, ampolla de neutralización y Termómetro de Beckmann
 * - Etapa A: Determinación del Equivalente en Agua del calorímetro (E)
 * - Etapa B: Determinación del Calor Total (Neutralización + Dilución) y marcha calorimétrica con áreas iguales
 * - Etapa C: Determinación del Calor de Dilución del ácido (Q_dil)
 * - Etapa D: Cálculo de Q_neutralización, ΔH por equivalente y comparación entre ácido fuerte (HCl) y débil (CH3COOH)
 */

window.TP4_Calorimetria = (function () {
  const DH_TEO_STRONG_KCAL = -13.70; // kcal/eq para H+(aq) + OH-(aq) -> H2O
  const DH_TEO_WEAK_KCAL = -13.25;   // kcal/eq para CH3COOH + NaOH (descuenta entalpía de ionización)

  function createInitialState() {
    return {
      stage: 'equivalente_agua', // 'equivalente_agua' | 'neutralizacion' | 'marcha_grafica' | 'dilucion' | 'calculos' | 'quiz'
      acidType: 'HCl',           // 'HCl' (ácido fuerte) | 'CH3COOH' (ácido débil para comparar en Modo Docente)
      acidConcN: 2.00,           // 10.00 mL de ácido 2.00 N -> 0.0200 equivalentes
      acidVolMl: 10.00,
      baseVolMl: 40.00,          // 40.0 mL NaOH 0.60 N + 100.0 mL H2O -> 140.0 mL en el termo
      waterAddedMl: 100.0,

      // Parámetros verdaderos del calorímetro
      realWaterEquivE: 10.2,     // E = 10.2 cal/°C
      tempAmbC: 20.50,

      // Etapa A: Equivalente en agua E
      m1ColdWaterG: 60.0,
      t1ColdWaterC: 20.50,
      m2HotWaterG: 60.0,
      t2HotWaterC: 100.0,
      tfEquivC: 57.14,
      equivDone: false,
      calcWaterEquivE: 10.2,

      // Etapa B: Marcha calorimétrica de Neutralización
      neutBaselineRecorded: false,
      neutAmpouleBlown: false,
      neutCurveDone: false,
      neutPoints: [],
      tInitialExtrapC: 20.520,
      tFinalExtrapC: 22.285,
      deltaTTotalC: 1.765,
      equalAreaLineMin: 2.5,     // Posición de la recta vertical c (min) para método de áreas iguales

      // Etapa C: Calor de dilución del ácido
      dilDone: false,
      deltaTDilC: 0.052,

      // Errores / Modificadores de Modo Docente y Parciales
      errors: {
        nonAdiabaticLoss: false,    // Termo con pérdidas hacia el exterior (subestima Delta T -> |ΔH| por DEFECTO)
        ignoreDilution: false,      // No restar Q_dilución (sobreestima |Q_neut| -> |ΔH| por EXCESO)
        ignoreWaterEquiv: false,    // Asumir E = 0 cal/°C (subestima capacidad calorífica -> |ΔH| por DEFECTO)
        incompleteAcidBlow: false,  // Queda parte del ácido sin salir de la ampolla al insuflar (-n_real -> |ΔH| por DEFECTO)
        acidHotterThanBase: false,  // Ácido en la ampolla a mayor T inicial que la base (+ΔT sensible -> |ΔH| por EXCESO)
        doubleVolumesSameConc: false // Duplicar volúmenes (300 mL totales y 0.04 eq): Q se duplica pero ΔH kcal/eq NO cambia
      },

      calculated: null,
      score: 0,

      calcSolved: {
        equiv_e: false,
        dt_total: false,
        q_total: false,
        q_dil: false,
        q_neut: false,
        n_eq: false,
        dh_neut: false
      }
    };
  }

  let state = createInitialState();

  /**
   * Calcula la temperatura final de equilibrio en la calibración del equivalente en agua E
   * 0 = E*(Tf - Ta) + m1*(Tf - Ta) + m2*(Tf - 100)
   */
  function computeEquivExperiment() {
    const E = state.realWaterEquivE;
    const m1 = state.m1ColdWaterG;
    const m2 = state.m2HotWaterG;
    const Ta = state.t1ColdWaterC;
    const Tc = state.t2HotWaterC;

    const Tf = ((m1 + E) * Ta + m2 * Tc) / (m1 + m2 + E);
    state.tfEquivC = Number(Tf.toFixed(2));
    state.calcWaterEquivE = Number(
      ((m2 * (Tc - state.tfEquivC) - m1 * (state.tfEquivC - Ta)) / (state.tfEquivC - Ta)).toFixed(2)
    );
    state.equivDone = true;
    return state.calcWaterEquivE;
  }

  /**
   * Genera los puntos realistas de la marcha calorimétrica (t en minutos vs T en °C)
   * según la Figura 3 de la Guía IQ 2019 (pág. 54)
   */
  function generateNeutralizationCurve() {
    const volMult = state.errors.doubleVolumesSameConc ? 2.0 : 1.0;
    const mSolG = (state.acidVolMl + state.baseVolMl + state.waterAddedMl) * volMult; // 150.0 g o 300.0 g
    const totalCap = mSolG * 1.0 + state.realWaterEquivE; // ~160.2 cal/°C
    const realBlowFactor = state.errors.incompleteAcidBlow ? 0.84 : 1.0; // Si queda ácido sin caer de la ampolla (84% cae)
    const nEqReal = (state.acidVolMl / 1000.0) * state.acidConcN * volMult * realBlowFactor;

    const dH_kcal = state.acidType === 'HCl' ? DH_TEO_STRONG_KCAL : DH_TEO_WEAK_KCAL;
    const qNeutCal = Math.abs(dH_kcal * 1000.0 * nEqReal); // ~274.0 cal liberadas
    const qDilCal = (state.acidType === 'HCl' ? 8.32 : 2.10) * volMult * realBlowFactor; // calor de dilución exotérmico
    const sensibleBonusCal = state.errors.acidHotterThanBase ? 32.0 * volMult : 0.0; // Si el ácido estaba más caliente antes de insuflar
    const qTotalCal = qNeutCal + qDilCal + sensibleBonusCal;

    let idealDeltaT = qTotalCal / totalCap; // ~1.762 °C
    if (state.errors.nonAdiabaticLoss) {
      idealDeltaT *= 0.89; // Pérdida térmica si el termo está mal tapado o sin vacío
    }

    const Ti = state.tempAmbC - 0.15; // Comienza levemente debajo de T_amb (acepta calor suave en rama a)
    const slopeA = 0.012; // °C/min (rama previa a la insuflación)
    const slopeB = state.errors.nonAdiabaticLoss ? -0.048 : -0.014; // °C/min (enfriamiento posterior en rama b)
    const tMix = 2.5; // Insuflación a los 2.5 minutos

    const T1_at_mix = Ti + slopeA * tMix;
    const T2_at_mix = T1_at_mix + idealDeltaT;

    const times = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 2.75, 3.0, 3.25, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];
    const pts = times.map(t => {
      let temp;
      if (t <= tMix) {
        temp = Ti + slopeA * t;
      } else {
        // Respuesta con inercia del termómetro + deriva de la recta b
        const dt = t - tMix;
        const riseFrac = 1.0 - Math.exp(-dt / 0.28);
        temp = T1_at_mix + idealDeltaT * riseFrac + slopeB * dt;
      }
      return {
        t_min: t,
        T_C: Number(temp.toFixed(3))
      };
    });

    state.neutPoints = pts;
    state.tInitialExtrapC = Number(T1_at_mix.toFixed(3));
    state.tFinalExtrapC = Number(T2_at_mix.toFixed(3));
    state.deltaTTotalC = Number((T2_at_mix - T1_at_mix).toFixed(3));
    state.deltaTDilC = Number((qDilCal / totalCap).toFixed(3));
    return pts;
  }

  /**
   * Calcula Q_total, Q_dilución, Q_neutralización y ΔH por equivalente (pág. 56 de la Guía)
   */
  function performFinalCalculations() {
    if (!state.equivDone) computeEquivExperiment();
    if (state.neutPoints.length === 0) generateNeutralizationCurve();

    const volMult = state.errors.doubleVolumesSameConc ? 2.0 : 1.0;
    const mSolG = (state.acidVolMl + state.baseVolMl + state.waterAddedMl) * volMult; // 150.0 g o 300.0 g
    const E_used = state.errors.ignoreWaterEquiv ? 0.0 : state.calcWaterEquivE;
    const sysHeatCap = mSolG * 1.0 + E_used; // cal/°C

    // 0 = Q_t + (m_sol * 1 + E) * (T_f - T_i)
    const Q_total_cal = -sysHeatCap * state.deltaTTotalC;
    const Q_dil_cal = state.errors.ignoreDilution ? 0.0 : -sysHeatCap * state.deltaTDilC;
    const Q_neut_cal = Q_total_cal - Q_dil_cal;

    const nEq = (state.acidVolMl / 1000.0) * state.acidConcN * volMult; // 0.0200 o 0.0400 equivalentes nominales
    const dH_exp_kcal_eq = (Q_neut_cal / 1000.0) / nEq;
    const relErrorPercent = ((dH_exp_kcal_eq - DH_TEO_STRONG_KCAL) / Math.abs(DH_TEO_STRONG_KCAL)) * 100.0;

    state.calculated = {
      mSolG,
      E_used,
      sysHeatCap,
      Q_total_cal,
      Q_dil_cal,
      Q_neut_cal,
      nEq,
      dH_exp_kcal_eq,
      dH_accepted_kcal_eq: DH_TEO_STRONG_KCAL,
      relErrorPercent
    };
    return state.calculated;
  }

  /**
   * Renderiza la escena activa de Calorimetría en el Canvas
   */
  function renderScene(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const tick = window.LabCommon.nextTick();

    if (state.stage === 'marcha_grafica') {
      renderCalorimetricCurveGraph(ctx, w, h);
      return;
    }

    let banner = 'TP 4: CALORIMETRÍA — CALOR DE NEUTRALIZACIÓN';
    if (state.stage === 'equivalente_agua') banner = 'ETAPA A: DETERMINACIÓN DEL EQUIVALENTE EN AGUA DEL CALORÍMETRO (E)';
    else if (state.stage === 'neutralizacion') banner = 'ETAPA B: MARCHA CALORIMÉTRICA DE NEUTRALIZACIÓN (HCl + NaOH)';
    else if (state.stage === 'dilucion') banner = 'ETAPA C: DETERMINACIÓN DEL CALOR DE DILUCIÓN DEL ÁCIDO';
    else if (state.stage === 'calculos' || state.stage === 'quiz') banner = 'ETAPA D: BALANCE ENTÁLPICO Y CALOR DE NEUTRALIZACIÓN POR EQUIVALENTE';

    window.LabCommon.drawLabBackground(ctx, w, h, banner);

    if (state.stage === 'calculos') {
      renderCalorimetryCalculations(ctx, w, h);
      return;
    }

    renderCalorimeterApparatus(ctx, w, h, tick);
  }

  function renderCalorimeterApparatus(ctx, w, h, tick) {
    const benchY = h - 62;
    const cx = 195;

    // 1. VASO TÉRMICO ADIABÁTICO ("TERMO" DE PAREDES DOBLES ESPEJADAS AL VACÍO - Figura 1 Guía)
    // Carcasa exterior metálica / plástica
    window.LabCommon.drawPixelBox(ctx, cx - 56, benchY - 148, 112, 148, '#263238', '#cfd8dc', 2);
    // Pared doble espejada con cámara de vacío
    window.LabCommon.drawPixelBox(ctx, cx - 46, benchY - 138, 92, 130, '#0d1321', '#90a4ae', 2);

    // Solución acuosa en el interior del termo
    ctx.fillStyle = state.neutAmpouleBlown ? 'rgba(6, 214, 160, 0.35)' : 'rgba(56, 189, 248, 0.32)';
    ctx.fillRect(cx - 42, benchY - 88, 84, 78);

    // Tapa de material aislante (corcho/poliestireno)
    window.LabCommon.drawPixelBox(ctx, cx - 50, benchY - 156, 100, 16, '#d4a373', '#f1faee', 1.5);

    // 2. ELEMENTOS QUE ATRAVIESAN LA TAPA (Figura 1: B Ampolla, C Termómetro Beckmann, D Agitador)
    // Ampolla de neutralización B con pera de insuflación
    const ampX = cx - 18;
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ampX, benchY - 185);
    ctx.lineTo(ampX, benchY - 42);
    ctx.stroke();

    // Bulbo de la ampolla de neutralización
    ctx.beginPath();
    ctx.arc(ampX, benchY - 56, 11, 0, Math.PI * 2);
    ctx.fillStyle = state.neutAmpouleBlown || state.dilDone
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 89, 100, 0.65)';
    ctx.fill();
    ctx.stroke();

    // Pera de goma superior para insuflar aire y desalojar el ácido
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.arc(ampX, benchY - 194, 9, 0, Math.PI * 2);
    ctx.fill();

    // Termómetro diferencial de Beckmann C
    const thX = cx + 8;
    ctx.fillStyle = '#fefae0';
    ctx.fillRect(thX - 3, benchY - 202, 6, 158);
    ctx.fillStyle = '#ff5964';
    ctx.fillRect(thX - 1.5, benchY - 140, 3, 96);
    // Reservorio superior de mercurio característico del Beckmann
    ctx.strokeStyle = '#fefae0';
    ctx.strokeRect(thX - 5, benchY - 214, 10, 12);

    // Agitador vertical D (animado al mezclar)
    const stirOffset = (state.neutAmpouleBlown || state.equivDone) ? Math.sin(tick * 0.25) * 6 : 0;
    const stX = cx + 28;
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stX, benchY - 188 + stirOffset);
    ctx.lineTo(stX, benchY - 30 + stirOffset);
    ctx.lineTo(stX - 14, benchY - 30 + stirOffset);
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CALORÍMETRO ADIABÁTICO', cx, benchY + 16);

    // 3. LUPA DEL TERMÓMETRO DIFERENCIAL DE BECKMANN (Centro: x = 370)
    const lx = 365, ly = 138, lr = 66;
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1321';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();
    ctx.clip();

    // Escala graduada a la centésima de grado
    ctx.fillStyle = '#fefae0';
    ctx.fillRect(lx - 26, ly - lr, 52, lr * 2);
    ctx.fillStyle = '#1f2937';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (let i = -4; i <= 4; i++) {
      const gy = ly + i * 13;
      ctx.fillRect(lx - 4, gy, i % 2 === 0 ? 12 : 7, 1);
    }

    // Columna capilar de mercurio
    let curTemp = state.tempAmbC;
    if (state.stage === 'equivalente_agua' && state.equivDone) curTemp = state.tfEquivC;
    else if (state.stage === 'neutralizacion' && state.neutAmpouleBlown) curTemp = state.tFinalExtrapC;
    else if (state.stage === 'dilucion' && state.dilDone) curTemp = state.tempAmbC + state.deltaTDilC;

    ctx.fillStyle = '#ff5964';
    ctx.fillRect(lx - 2, ly - 12, 6, lr + 12);
    ctx.restore();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LUPA TERMÓMETRO BECKMANN', lx, 58);
    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`T = ${curTemp.toFixed(3)} °C`, lx, 224);
    ctx.fillStyle = '#a0aec0';
    ctx.font = '9.5px monospace';
    ctx.fillText('Apreciación: ±0.005 °C', lx, 240);

    // 4. PANEL DERECHO: DATOS DE LA ETAPA ACTUAL
    window.LabCommon.drawPixelBox(ctx, 465, 52, 275, 185, '#161e2e', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 11.5px monospace';
    ctx.textAlign = 'left';

    if (state.stage === 'equivalente_agua') {
      ctx.fillText('CALIBRACIÓN EQUIVALENTE (E):', 478, 72);
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '11px monospace';
      ctx.fillText(`Agua fría (m₁):    ${state.m1ColdWaterG.toFixed(1)} g a ${state.t1ColdWaterC.toFixed(2)} °C`, 478, 96);
      ctx.fillText(`Agua caliente(m₂): ${state.m2HotWaterG.toFixed(1)} g a ${state.t2HotWaterC.toFixed(1)} °C`, 478, 116);
      ctx.fillText(`T final eq (Tf):   ${state.equivDone ? state.tfEquivC.toFixed(2) + ' °C' : 'Pendiente'}`, 478, 136);
      ctx.fillStyle = state.calcSolved.equiv_e ? '#06d6a0' : '#ff9f1c';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `Equiv. E hallado:  ${
          !state.equivDone
            ? 'Pendiente medir Tf'
            : state.calcSolved.equiv_e
            ? state.calcWaterEquivE.toFixed(2) + ' cal/°C'
            : '[ ? Calcular abajo ]'
        }`,
        478,
        166
      );
      ctx.fillStyle = '#cbd5e0';
      ctx.font = '10px monospace';
      ctx.fillText('0 = (m₁+E)(Tf-Ta) + m₂(Tf-100)', 478, 195);
    } else if (state.stage === 'neutralizacion') {
      ctx.fillText('REACCIÓN DE NEUTRALIZACIÓN:', 478, 72);
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '11px monospace';
      ctx.fillText(`En termo: 40mL NaOH + 100mL H₂O`, 478, 95);
      ctx.fillText(`En ampolla: 10.00 mL ${state.acidType} 2.0 N`, 478, 114);
      ctx.fillText(`Masa total m_sol:  150.0 g`, 478, 133);
      ctx.fillText(`Equivalente E:     ${state.calcWaterEquivE.toFixed(1)} cal/°C`, 478, 152);
      ctx.fillStyle = state.neutAmpouleBlown ? '#06d6a0' : '#ff9f1c';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        state.neutAmpouleBlown
          ? `Lectura T máx: ${state.tFinalExtrapC.toFixed(3)} °C`
          : 'Clic en la pera para insuflar',
        478,
        180
      );
    } else {
      ctx.fillText('CALOR DE DILUCIÓN DEL ÁCIDO:', 478, 72);
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '11px monospace';
      ctx.fillText(`En termo: 140.0 mL H₂O destilada`, 478, 95);
      ctx.fillText(`En ampolla: 10.00 mL ${state.acidType} 2.0 N`, 478, 114);
      ctx.fillStyle = state.dilDone ? '#06d6a0' : '#ff9f1c';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        state.dilDone
          ? `ΔT_dilución = +${state.deltaTDilC.toFixed(3)} °C`
          : 'Pendiente de insuflar ampolla',
        478,
        146
      );
      ctx.fillStyle = '#cbd5e0';
      ctx.font = '10px monospace';
      ctx.fillText('Se descuenta del calor total para', 478, 178);
      ctx.fillText('obtener Q_neutralización puro.', 478, 194);
    }
  }

  function renderCalorimetricCurveGraph(ctx, w, h) {
    window.LabCommon.drawLabBackground(
      ctx,
      w,
      h,
      'MARCHA CALORIMÉTRICA — MÉTODO GRÁFICO DE ÁREAS IGUALES (FIG. 3 GUÍA)',
      22
    );
    if (state.neutPoints.length === 0) generateNeutralizationCurve();

    const pts = state.neutPoints.map(p => ({ x: p.t_min, y: p.T_C, color: '#06d6a0' }));
    const Ti = state.tempAmbC - 0.15;
    const slopeA = 0.012;
    const slopeB = state.errors.nonAdiabaticLoss ? -0.048 : -0.014;
    const tC = state.equalAreaLineMin;

    const T1_ext = Ti + slopeA * tC;
    const T2_ext = state.tFinalExtrapC + slopeB * (tC - 2.5);

    window.LabCommon.drawScientificPlot(ctx, {
      x: 58,
      y: 56,
      width: 430,
      height: 185,
      minX: 0,
      maxX: 6.0,
      minY: 20.2,
      maxY: 22.6,
      title: 'Temperatura (°C) vs. Tiempo (min) — Extrapolación de Rectas a y b',
      xLabel: 'Tiempo t (minutos)',
      yLabel: 'Temp (°C)',
      points: pts,
      decimalsX: 1,
      decimalsY: 2,
      extraLines: [
        // Prolongación de la recta a (calentamiento previo)
        { x1: 0, y1: Ti, x2: 4.0, y2: Ti + slopeA * 4.0, color: '#7bdff2', dashed: true },
        // Prolongación de la recta b (enfriamiento posterior)
        { x1: 2.0, y1: state.tFinalExtrapC - slopeB * 0.5, x2: 6.0, y2: state.tFinalExtrapC + slopeB * 3.5, color: '#7bdff2', dashed: true },
        // Recta vertical c que iguala áreas 1 y 2
        { x1: tC, y1: 20.2, x2: tC, y2: 22.5, color: '#ffd166', width: 2 }
      ],
      summaryLines: [
        { text: 'MÉTODO DE ÁREAS IGUALES:', bold: true, color: '#ffd166', gap: 19 },
        { text: `Recta vertical c: t = ${tC.toFixed(2)} min`, color: '#f8f9fa' },
        { text: `Intersección T₁:  ${T1_ext.toFixed(3)} °C`, color: '#7bdff2' },
        { text: `Intersección T₂:  ${T2_ext.toFixed(3)} °C`, color: '#7bdff2', gap: 20 },
        { text: `ΔT_total = T₂ - T₁:`, bold: true, color: '#06d6a0' },
        {
          text: state.calcSolved.dt_total ? `+${(T2_ext - T1_ext).toFixed(3)} °C` : '[ ? Calcular abajo ]',
          bold: true,
          color: state.calcSolved.dt_total ? '#06d6a0' : '#ff9f1c',
          gap: 20
        },
        { text: 'Compensa el intercambio de', color: '#cbd5e0' },
        { text: 'calor con el exterior y la', color: '#cbd5e0' },
        { text: 'inercia del termómetro.', color: '#cbd5e0' }
      ]
    });
  }

  function renderCalorimetryCalculations(ctx, w, h) {
    const calc = state.calculated || performFinalCalculations();

    // Pizarrón izquierdo: Balance Calorimétrico
    window.LabCommon.drawPixelBox(ctx, 24, 50, 345, 195, '#151c2c', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1. BALANCES DE CALOR (Ecuación 1):', 38, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`Equivalente agua (E):  ${calc.E_used.toFixed(2)} cal/°C`, 38, 95);
    ctx.fillText(`Masa solución (m_sol): ${calc.mSolG.toFixed(1)} g (c = 1 cal/g°C)`, 38, 114);
    ctx.fillText(`ΔT_total (gráfico):    +${state.deltaTTotalC.toFixed(3)} °C`, 38, 133);
    ctx.fillStyle = state.calcSolved.q_total ? '#ffd166' : '#ff9f1c';
    ctx.fillText(
      `Q_total (neut + dil):  ${state.calcSolved.q_total ? calc.Q_total_cal.toFixed(2) + ' cal' : '[ ? Calcular abajo ]'}`,
      38,
      155
    );
    ctx.fillStyle = '#f8f9fa';
    ctx.fillText(`ΔT_dilución ácido:     +${state.deltaTDilC.toFixed(3)} °C`, 38, 176);
    ctx.fillStyle = state.calcSolved.q_dil ? '#f8f9fa' : '#ff9f1c';
    ctx.fillText(
      `Q_dilución ácido:      ${state.calcSolved.q_dil ? calc.Q_dil_cal.toFixed(2) + ' cal' : '[ ? Calcular abajo ]'}`,
      38,
      195
    );
    ctx.fillStyle = state.calcSolved.q_neut ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `Q_neutralización:      ${state.calcSolved.q_neut ? calc.Q_neut_cal.toFixed(2) + ' cal' : '[ ? Calcular abajo ]'}`,
      38,
      218
    );

    // Pizarrón derecho: Entalpía Molar / por Equivalente
    window.LabCommon.drawPixelBox(ctx, 385, 50, 351, 195, '#151c2c', '#ffd166', 2);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('2. ENTALPÍA DE NEUTRALIZACIÓN:', 399, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`Ácido empleado:        ${state.acidType} (${state.acidType === 'HCl' ? 'Fuerte' : 'Débil'})`, 399, 95);
    ctx.fillStyle = state.calcSolved.n_eq ? '#f8f9fa' : '#ff9f1c';
    ctx.fillText(
      `Equivalentes (n_eq):   ${state.calcSolved.n_eq ? calc.nEq.toFixed(4) + ' eq' : '[ ? Calcular abajo ]'}`,
      399,
      114
    );
    ctx.fillStyle = state.calcSolved.dh_neut ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `ΔH_exp neutralización: ${state.calcSolved.dh_neut ? calc.dH_exp_kcal_eq.toFixed(2) + ' kcal/eq' : '[ ? Calcular abajo ]'}`,
      399,
      140
    );
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '11px monospace';
    ctx.fillText(`ΔH°_298 aceptado:      ${calc.dH_accepted_kcal_eq.toFixed(2)} kcal/mol`, 399, 162);

    const errAbs = Math.abs(calc.relErrorPercent);
    ctx.fillStyle = !state.calcSolved.dh_neut
      ? '#ff9f1c'
      : errAbs < 2.0
      ? '#06d6a0'
      : errAbs < 6.0
      ? '#ff9f1c'
      : '#ff5964';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `Error relativo %:      ${
        state.calcSolved.dh_neut ? (calc.relErrorPercent >= 0 ? '+' : '') + calc.relErrorPercent.toFixed(2) + ' %' : '[ ? ]'
      }`,
      399,
      190
    );

    ctx.fillStyle = '#7bdff2';
    ctx.font = '10px monospace';
    ctx.fillText('H⁺(aq) + OH⁻(aq) → H₂O(l) (Exotérmica)', 399, 216);
  }

  return {
    getState: function () {
      return state;
    },

    reset: function () {
      state = createInitialState();
    },

    computeEquivExperiment: computeEquivExperiment,
    generateNeutralizationCurve: generateNeutralizationCurve,
    performFinalCalculations: performFinalCalculations,
    renderScene: renderScene,

    getHudInfo: function () {
      const eTxt = state.equivDone ? `${state.calcWaterEquivE.toFixed(1)} cal/°C` : 'Pendiente';
      const dhTxt = state.calculated ? `${state.calculated.dH_exp_kcal_eq.toFixed(2)} kcal/eq` : 'Pendiente';
      return [
        { label: 'TP Actual:', value: '4. Calorimetría' },
        { label: 'Equiv. E:', value: eTxt },
        { label: 'ΔT_total:', value: state.neutAmpouleBlown ? `+${state.deltaTTotalC.toFixed(3)} °C` : 'Pendiente' },
        { label: 'ΔH_neut:', value: dhTxt },
        { label: 'Puntaje:', value: `${state.score} pts` }
      ];
    },

    getLogbookData: function () {
      const calc = state.calculated;
      const headers = ['Etapa', 'Tiempo / Parámetro', 'Lectura / Expresión', 'Valor', 'Unidad'];
      const rows = [
        ['Etapa A (Equiv. E)', 'Agua fría en termo (m₁, Ta)', '60.0 g', state.t1ColdWaterC.toFixed(2), '°C'],
        ['Etapa A (Equiv. E)', 'Agua caliente agregada (m₂)', '60.0 g', state.t2HotWaterC.toFixed(1), '°C'],
        ['Etapa A (Equiv. E)', 'Temperatura final (Tf)', 'Equilibrio térmico', state.equivDone ? state.tfEquivC.toFixed(2) : 'Pendiente', '°C'],
        ['Etapa A (Equiv. E)', 'Equivalente en agua', 'E', state.equivDone ? state.calcWaterEquivE.toFixed(2) : 'Pendiente', 'cal/°C']
      ];

      state.neutPoints.forEach(pt => {
        rows.push([
          'Etapa B (Marcha)',
          `t = ${pt.t_min.toFixed(2)} min`,
          pt.t_min === 2.5 ? 'Insuflación de ampolla' : 'Lectura Beckmann',
          pt.T_C.toFixed(3),
          '°C'
        ]);
      });

      if (state.dilDone) {
        rows.push(['Etapa C (Dilución)', 'Salto por dilución ácido', 'ΔT_dil', `+${state.deltaTDilC.toFixed(3)}`, '°C']);
      }

      if (calc) {
        rows.push(
          ['Resultados', 'Calor total (neut + dil)', 'Q_total', calc.Q_total_cal.toFixed(2), 'cal'],
          ['Resultados', 'Calor de dilución ácido', 'Q_dilución', calc.Q_dil_cal.toFixed(2), 'cal'],
          ['Resultados', 'Calor neto neutralización', 'Q_neut = Q_tot - Q_dil', calc.Q_neut_cal.toFixed(2), 'cal'],
          ['Resultados', 'Entalpía de neutralización', 'ΔH_neut = Q_neut / n_eq', calc.dH_exp_kcal_eq.toFixed(2), 'kcal/eq'],
          ['Resultados', 'Error relativo respecto a -13.7', 'Er %', calc.relErrorPercent.toFixed(2), '%']
        );
      }

      return {
        title: 'Calorimetría — Determinación del Calor de Neutralización',
        metaHtml: `<strong>Sistema:</strong> Termo adiabático con ampolla de insuflación y Termómetro de Beckmann (±0.005 °C) &nbsp;|&nbsp; <strong>Reacción:</strong> ${state.acidType} (10.00 mL 2.00 N) + NaOH (40.0 mL 0.60 N) + 100 mL H₂O`,
        headers: headers,
        rows: rows,
        metaLines: [
          `Equivalente en agua del calorímetro (E): ${state.calcWaterEquivE.toFixed(2)} cal/°C`,
          `Ácido neutralizado: 10.00 mL de ${state.acidType} 2.00 N (0.0200 equivalentes)`,
          `Masa total de solución acuosa en el termo: 150.0 g`
        ],
        conclusionLines: calc
          ? [
              `Variación de temperatura total por áreas iguales (ΔT_total): +${state.deltaTTotalC.toFixed(3)} °C`,
              `Calor total desprendido (Q_total): ${calc.Q_total_cal.toFixed(2)} cal`,
              `Calor de dilución del ácido (Q_dilución): ${calc.Q_dil_cal.toFixed(2)} cal`,
              `Entalpía de neutralización experimental: ${calc.dH_exp_kcal_eq.toFixed(2)} kcal/eq (Valor tabulado: -13.70 kcal/eq, Error: ${calc.relErrorPercent.toFixed(2)} %)`
            ]
          : ['Cálculos finales pendientes de completar las 3 etapas calorimétricas.']
      };
    }
  };
})();
