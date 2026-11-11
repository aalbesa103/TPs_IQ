/**
 * tp3_victor_meyer.js
 * Trabajo Práctico 3: Determinación de Pesos Moleculares por el Método de Víctor Meyer
 * (Guía IQ 2019, Págs. 44-48; evolución en formato RPG de aalbesa103/VM)
 */

window.TP3_VictorMeyer = (function () {
  const R_ATM = 0.082057;
  const MAX_BELL_VOL_ML = 50.0;

  const SUBSTANCES = {
    chloroform: {
      key: 'chloroform',
      name: 'Cloroformo',
      formula: 'CHCl₃',
      empirical: 'CHCl₃',
      empiricalMass: 119.38,
      mw: 119.38,
      bp: 61.2,
      defaultMassG: 0.158,
      composition: '10.05% C, 0.84% H, 89.10% Cl'
    },
    ethyl_acetate: {
      key: 'ethyl_acetate',
      name: 'Acetato de etilo',
      formula: 'C₄H₈O₂',
      empirical: 'C₂H₄O',
      empiricalMass: 44.05,
      mw: 88.11,
      bp: 77.1,
      defaultMassG: 0.118,
      composition: '54.53% C, 9.15% H, 36.32% O'
    },
    dichloroethane: {
      key: 'dichloroethane',
      name: '1,2-Dicloroetano (Incógnita Guía)',
      formula: 'C₂H₄Cl₂',
      empirical: 'CH₂Cl',
      empiricalMass: 49.48,
      mw: 98.96,
      bp: 83.5,
      defaultMassG: 0.132,
      composition: '24.27% C, 4.07% H, 71.66% Cl'
    },
    acetone: {
      key: 'acetone',
      name: 'Acetona',
      formula: 'C₃H₆O',
      empirical: 'C₃H₆O',
      empiricalMass: 58.08,
      mw: 58.08,
      bp: 56.0,
      defaultMassG: 0.078,
      composition: '62.04% C, 10.41% H, 27.55% O'
    },
    diethyl_ether: {
      key: 'diethyl_ether',
      name: 'Éter etílico',
      formula: 'C₄H₁₀O',
      empirical: 'C₄H₁₀O',
      empiricalMass: 74.12,
      mw: 74.12,
      bp: 34.6,
      defaultMassG: 0.098,
      composition: '64.82% C, 13.60% H, 21.58% O'
    }
  };

  function createInitialState() {
    return {
      stage: 'preparacion', // 'preparacion' | 'pesada' | 'vaporizacion' | 'lectura' | 'calculos' | 'quiz'
      substanceKey: 'chloroform',
      tempAmbC: 22.0,
      patmMmHg: 758.0,

      // Estado de las etapas
      bathBoiling: false,
      purgeCount: 0,
      tubePurged: false,
      bellPlaced: false,
      emptyCapillaryMassG: 0.4120,
      ampouleWeighed: false,
      ampouleDropped: false,
      stopperClosedFast: true,
      vaporizingAnim: false,
      animProgress: 0.0, // 0.0 a 1.0 (0..0.25 caída ampolla, 0.25..1.0 burbujeo y llenado de campana)
      vaporizationDone: false,
      resultsCalculated: false,

      calcSolved: {
        m_neta: false,
        ph_mmhg: false,
        p_seco_atm: false,
        n_mmol: false,
        mw_exp: false,
        mult_n: false
      },

      // Datos medidos en el experimento
      sampleMassG: 0.158,
      waterColumnCm: 11.2,
      unclampedVolMl: 0.0,
      collectedVolMl: 0.0,
      bellOverflowed: false,

      // Errores experimentales de parcial (configurables en Modo Alumno y Modo Docente)
      errors: {
        skipPurge: false,          // Insuflado previo insuficiente: queda vapor previo que condensa en campana (-V -> PM por EXCESO)
        slowStopperLoss: false,    // Tapón con pérdidas o demora al tapar: escapa 18% de vapor (-V -> PM por EXCESO)
        ampouleStuckTop: false,    // Ampollita queda trabada en parte superior fría del tubo: vaporización incompleta (-V -> PM por EXCESO)
        notInThermalRegime: false, // Equipo no estaba en régimen (T en ascenso): aire se dilata (+V -> PM por DEFECTO)
        oilBath147C: false,        // Baño de aceite a 147 °C en régimen: vaporiza completo y desplaza igual n de aire (SIN ERROR)
        ignorePvWater: false,      // No restar P_v(H2O) en el cálculo (+P -> PM por DEFECTO)
        ignoreWaterColumn: false,  // No restar columna hidrostática h/13.6 en el cálculo (+P -> PM por DEFECTO)
        useBathTempError: false,   // Usar T del baño (373 K) en lugar de T de la campana (295 K) en PV=nRT (+T -> PM por EXCESO)
        airBubbleInBellStart: false, // Burbuja de aire inicial (+5.5 mL) en la campana antes de largar la ampolla (+V -> PM por DEFECTO)
        liquidBoilsAboveBath: false  // Líquido con T_eb > T_baño (no hierve totalmente, solo evapora parcial -> -V -> PM por EXCESO)
      },

      calculated: null,
      score: 0
    };
  }

  let state = createInitialState();

  function getCurrentSubstance() {
    return SUBSTANCES[state.substanceKey] || SUBSTANCES.chloroform;
  }

  /**
   * Simula el volumen de aire desplazado hacia la campana colectora (mL)
   * y calcula si se produce desborde (V_real > 50,0 mL) por pesar exceso de muestra.
   */
  function computeCollectedVolume() {
    const sub = getCurrentSubstance();
    const T_K = state.tempAmbC + 273.15;
    const pvMmHg = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);

    // Moles reales de líquido vaporizado
    let effectiveMassG = state.sampleMassG;
    if (state.errors.slowStopperLoss) {
      effectiveMassG *= 0.82; // Se pierde un 18% por la boca superior antes de tapar
    }
    if (state.errors.ampouleStuckTop) {
      effectiveMassG *= 0.64; // Queda trabada arriba en zona fría: no se vaporiza completamente (-36% de volumen)
    }
    if (state.errors.liquidBoilsAboveBath) {
      effectiveMassG *= 0.45; // Si T_eb > T_baño, no entra en ebullición franca y vaporiza menos de la mitad (-55% de volumen)
    }

    let molesDisplaced = effectiveMassG / sub.mw;
    if (state.errors.skipPurge) {
      // Si no se insufló aire seco, parte del gas desplazado es vapor orgánico de la corrida anterior
      // que condensa al entrar al agua fría de la campana (Problemas 9 y 13-ii de la Guía)
      molesDisplaced *= 0.78;
    }
    if (state.errors.notInThermalRegime) {
      // Si el equipo aún no estaba en régimen (T en ascenso), la dilatación térmica del aire del bulbo
      // empuja moles extra de aire hacia la campana (+24% de volumen recogido -> PM por defecto)
      molesDisplaced *= 1.24;
    }
    // Nota pedagógica de parcial: si state.errors.oilBath147C === true (aceite a 147°C en régimen),
    // como T_baño > T_eb y está en régimen, desplazará exactamente el mismo número de moles a la campana (SIN ERROR).

    // Primera estimación de columna hidrostática h en función del llenado de la campana de 50 mL
    const pApproxAtm = Math.max(100, state.patmMmHg - pvMmHg - 8.0) / 760.0;
    const volApproxMl = ((molesDisplaced * R_ATM * T_K) / pApproxAtm) * 1000.0;

    // La altura de la columna de agua h baja a medida que entra gas a la campana (h = 22 cm con V=0, h = 0 cm con V>=50 mL)
    const clampedApprox = Math.min(MAX_BELL_VOL_ML, Math.max(0, volApproxMl));
    state.waterColumnCm = Number(Math.max(0.0, 22.0 * (1.0 - clampedApprox / MAX_BELL_VOL_ML)).toFixed(1));

    const phMmHg = (state.waterColumnCm * 10.0) / 13.5951;
    const pGasRealMmHg = Math.max(100, state.patmMmHg - pvMmHg - phMmHg);
    const pGasRealAtm = pGasRealMmHg / 760.0;

    const volRealMl =
      ((molesDisplaced * R_ATM * T_K) / pGasRealAtm) * 1000.0 +
      (state.errors.airBubbleInBellStart ? 5.5 : 0.0);
    state.unclampedVolMl = Math.max(2.0, volRealMl);
    state.bellOverflowed = state.unclampedVolMl > MAX_BELL_VOL_ML;

    if (state.bellOverflowed) {
      state.collectedVolMl = MAX_BELL_VOL_ML;
      state.waterColumnCm = 0.0;
    } else {
      state.collectedVolMl = state.unclampedVolMl;
      state.waterColumnCm = Number(Math.max(0.5, 22.0 * (1.0 - state.collectedVolMl / 52.0)).toFixed(1));
    }

    return state.collectedVolMl;
  }

  /**
   * Ejecuta los cálculos del peso molecular y fórmula molecular según la Guía IQ 2019 (pág. 46)
   */
  function performCalculations() {
    if (state.collectedVolMl <= 0) computeCollectedVolume();
    const sub = getCurrentSubstance();
    const T_K_real = state.tempAmbC + 273.15;
    const T_K = state.errors.useBathTempError ? (state.errors.oilBath147C ? 147.0 + 273.15 : 100.0 + 273.15) : T_K_real;
    const pvRealMmHg = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);
    const phRealMmHg = (state.waterColumnCm * 10.0) / 13.5951;

    const pvUsedMmHg = state.errors.ignorePvWater ? 0.0 : pvRealMmHg;
    const phUsedMmHg = state.errors.ignoreWaterColumn ? 0.0 : phRealMmHg;

    const pGasCorrMmHg = state.patmMmHg - pvUsedMmHg - phUsedMmHg;
    const pGasCorrAtm = pGasCorrMmHg / 760.0;
    const volL = state.collectedVolMl / 1000.0;

    const molesCalc = (pGasCorrAtm * volL) / (R_ATM * T_K);
    const mwExp = molesCalc > 0 ? state.sampleMassG / molesCalc : 0;
    const relErrPercent = ((mwExp - sub.mw) / sub.mw) * 100.0;

    // Determinación de la atomicidad n_mult de la fórmula molecular: FM = (Fórmula Mínima)_n
    const multRatio = Math.max(1, Math.round(mwExp / sub.empiricalMass));
    const deducedFormula = multRatio === 1 ? sub.empirical : `(${sub.empirical})${multRatio} → ${sub.formula}`;

    state.calculated = {
      T_K,
      pvRealMmHg,
      phRealMmHg,
      pvUsedMmHg,
      phUsedMmHg,
      pGasCorrMmHg,
      pGasCorrAtm,
      molesCalc,
      mwExp,
      mwTeo: sub.mw,
      relErrPercent,
      multRatio,
      deducedFormula
    };
    state.resultsCalculated = true;
    return state.calculated;
  }

  /**
   * Dibuja el equipo completo de Víctor Meyer + Lupa de la Campana Colectora en el Canvas de 760x300
   */
  function renderScene(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const tick = window.LabCommon.nextTick();
    const sub = getCurrentSubstance();

    let banner = `TP 3: MÉTODO DE VÍCTOR MEYER — MUESTRA: ${sub.name.toUpperCase()}`;
    if (state.stage === 'preparacion') banner = 'ETAPA 1: CALEFACCIÓN A RÉGIMEN Y PURGADO DE AIRE SECO';
    else if (state.stage === 'pesada') banner = 'ETAPA 2: CARGA Y PESADA DE LA MICROAMPOLLA CON LÍQUIDO VOLÁTIL';
    else if (state.stage === 'vaporizacion') banner = 'ETAPA 3: CAÍDA DE LA AMPOLLA, VAPORIZACIÓN Y LLENADO DE LA CAMPANA';
    else if (state.stage === 'lectura') banner = 'ETAPA 4: LECTURA DE VOLUMEN V Y COLUMNA h EN LA CAMPANA COLECTORA';
    else if (state.stage === 'calculos' || state.stage === 'quiz') banner = 'ETAPA 5: CAMPANA COLECTORA Y PIZARRA DE CÁLCULO DE PESO MOLECULAR';

    window.LabCommon.drawLabBackground(ctx, w, h, banner);

    const benchY = h - 56;

    // Fracción actual de llenado de la campana durante la animación (0.0 a 1.0)
    let fillFraction = 0.0;
    let dropFraction = 0.0;
    if (state.vaporizingAnim) {
      dropFraction = Math.min(1.0, state.animProgress / 0.25);
      fillFraction = Math.max(0.0, Math.min(1.0, (state.animProgress - 0.25) / 0.75));
    } else if (state.vaporizationDone) {
      dropFraction = 1.0;
      fillFraction = 1.0;
    }

    const currentUnclampedMl = state.unclampedVolMl * fillFraction;
    const currentGasVolMl = Math.min(MAX_BELL_VOL_ML, currentUnclampedMl);
    const isCurrentlyOverflowing = currentUnclampedMl > MAX_BELL_VOL_ML;
    const currentWaterColCm = isCurrentlyOverflowing
      ? 0.0
      : Number(Math.max(0.0, 22.0 * (1.0 - currentGasVolMl / 52.0)).toFixed(1));

    // =========================================================================
    // 1. EQUIPO DE VÍCTOR MEYER (Izquierda: x = 115)
    // =========================================================================
    const vx = 115;
    window.LabCommon.drawBunsen(ctx, vx, benchY, state.bathBoiling);

    // Camisa calefactora externa (Baño de agua a 100 °C o Baño de aceite a 147 °C)
    ctx.fillStyle = state.errors.oilBath147C
      ? 'rgba(245, 158, 11, 0.34)'
      : 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.arc(vx, benchY - 56, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(vx - 17, 64, 34, benchY - 118);
    ctx.strokeStyle = state.errors.oilBath147C ? '#f59e0b' : '#9aa5b1';
    ctx.lineWidth = 2;
    ctx.strokeRect(vx - 17, 64, 34, benchY - 106);

    if (state.errors.oilBath147C) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Aceite 147°C', vx - 46, 130);
    }
    if (state.errors.notInThermalRegime) {
      ctx.fillStyle = '#ff9f1c';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Sin régimen', vx - 48, 146);
    }

    // Burbujas de vapor en la camisa calefactora si está en ebullición
    if (state.bathBoiling) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let b = 0; b < 4; b++) {
        const by = benchY - 48 - ((tick * 2 + b * 35) % 125);
        ctx.beginPath();
        ctx.arc(vx - 11 + (b % 2) * 22, by, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Tubo de vaporización interno (b) con amortiguador de lana de vidrio en el fondo
    ctx.fillStyle =
      fillFraction > 0
        ? `rgba(255, 209, 102, ${0.15 + 0.25 * fillFraction})`
        : state.tubePurged
        ? 'rgba(6, 214, 160, 0.14)'
        : 'rgba(255, 89, 100, 0.18)';
    ctx.fillRect(vx - 8, 50, 16, benchY - 98);
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.strokeRect(vx - 8, 50, 16, benchY - 98);

    // Colchón de lana de vidrio en el fondo del tubo interno
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(vx - 7, benchY - 54, 14, 6);

    // Animación de caída de la ampollita y tapón superior
    if (state.ampouleDropped || state.vaporizingAnim) {
      // Tapón superior colocado
      ctx.fillStyle = state.stopperClosedFast && !state.errors.slowStopperLoss ? '#06d6a0' : '#ff5964';
      ctx.fillRect(vx - 10, 40, 20, 10);

      // Posición vertical de la ampollita mientras cae por el tubo (si queda trabada arriba se detiene en zona fría)
      const maxDropY = state.errors.ampouleStuckTop ? 36 : benchY - 116;
      const fallY = 58 + dropFraction * maxDropY;
      ctx.fillStyle = state.errors.ampouleStuckTop ? '#ff5964' : '#ffd166';
      ctx.beginPath();
      ctx.arc(vx, fallY, 4.2, 0, Math.PI * 2);
      ctx.fill();

      if (state.errors.ampouleStuckTop) {
        ctx.fillStyle = '#ff5964';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Trabada arriba', vx - 48, 96);
      }

      // Si hubo pérdida por tapar lento, mostrar nubecita escapando arriba
      if (state.errors.slowStopperLoss && fillFraction > 0 && fillFraction < 0.85) {
        ctx.fillStyle = 'rgba(255, 89, 100, 0.85)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('💨 Fuga vapor', vx, 34);
      }
    }

    // =========================================================================
    // 2. TUBO DE DESPRENDIMIENTO Y CAMPANA COLECTORA (Centro-Izquierda: x = 250)
    // =========================================================================
    const cx = 250;
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vx + 8, 84);
    ctx.lineTo(cx - 42, 84);
    ctx.lineTo(cx - 42, benchY - 14);
    ctx.lineTo(cx, benchY - 14);
    ctx.stroke();

    // Cristalizador (cuba hidroneumática con agua a temperatura ambiente)
    const waterSurfaceY = benchY - 46;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(cx - 38, waterSurfaceY, 76, 44);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 38, benchY - 56, 76, 54);

    // Campana graduada invertida (eudiómetro de 50 mL)
    if (state.bellPlaced || state.stage !== 'preparacion') {
      const bellTopY = 60;
      const bellH = waterSurfaceY - bellTopY + 34;
      const maxGasHeightPx = 122; // 50.0 mL llegan hasta la boca inferior de la campana
      const gasHeightPx = (currentGasVolMl / MAX_BELL_VOL_ML) * maxGasHeightPx;
      const innerWaterLevelY = bellTopY + gasHeightPx;

      // Parte superior con gas desplazado (aire + vapor de agua)
      ctx.fillStyle = isCurrentlyOverflowing ? 'rgba(255, 89, 100, 0.28)' : 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(cx - 14, bellTopY, 28, gasHeightPx);

      // Columna hidrostática de agua h dentro de la campana
      ctx.fillStyle = 'rgba(56, 189, 248, 0.68)';
      ctx.fillRect(cx - 14, innerWaterLevelY, 28, Math.max(0, waterSurfaceY + 32 - innerWaterLevelY));

      // Burbujas subiendo dentro de la campana durante el llenado
      if (state.vaporizingAnim && fillFraction > 0 && fillFraction < 1.0) {
        ctx.fillStyle = '#ffffff';
        for (let b = 0; b < 5; b++) {
          const by = (benchY - 16) - ((tick * 3.5 + b * 24) % Math.max(20, benchY - 16 - innerWaterLevelY));
          const bx = cx - 4 + Math.sin(tick * 0.2 + b) * 4;
          ctx.beginPath();
          ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Si se pesó de más (DESBORDE > 50 mL), mostrar burbujas escapando por fuera de la campana
      if (isCurrentlyOverflowing) {
        ctx.fillStyle = '#ff5964';
        for (let b = 0; b < 6; b++) {
          const side = b % 2 === 0 ? -22 : 22;
          const by = (benchY - 12) - ((tick * 3 + b * 14) % 38);
          ctx.beginPath();
          ctx.arc(cx + side + Math.sin(tick * 0.3 + b) * 3, by, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ff5964';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ¡DESBORDE! (> 50 mL)', cx, bellTopY - 8);
      }

      ctx.strokeStyle = isCurrentlyOverflowing ? '#ff5964' : '#f1faee';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 14, bellTopY, 28, bellH);

      // Graduaciones cada 10 mL en la campana
      ctx.fillStyle = '#e2e8f0';
      for (let ml = 10; ml <= 50; ml += 10) {
        const gy = bellTopY + (ml / 50.0) * maxGasHeightPx;
        ctx.fillRect(cx - 14, gy, 7, 1.5);
      }
    }

    // =========================================================================
    // 3. LUPA DE ESCALA DE LA CAMPANA (Centro: x = 315 a 430) O BALANZA EN ETAPA 2
    // =========================================================================
    if (state.stage === 'pesada') {
      // Mostrar previsualización del volumen esperado según la masa elegida en el slider
      const pvPreview = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);
      const pSecoPreview = (state.patmMmHg - pvPreview - 8.0) / 760.0;
      const expectedVolMl = ((state.sampleMassG / sub.mw) * R_ATM * (state.tempAmbC + 273.15) / pSecoPreview) * 1000.0;
      const willOverflow = expectedVolMl > MAX_BELL_VOL_ML;

      const mStr = state.ampouleWeighed ? `${(state.emptyCapillaryMassG + state.sampleMassG).toFixed(4)} g` : '0.0000 g';
      window.LabCommon.drawAnalyticalBalance(
        ctx,
        545,
        benchY,
        mStr,
        `AMPOLLA LLENA (m_vacía = ${state.emptyCapillaryMassG.toFixed(4)} g)`,
        state.ampouleWeighed ? 'capilar_vm' : 'none'
      );

      // Indicador en vivo de capacidad de la campana (para probar qué pasa si se pesa de más)
      window.LabCommon.drawPixelBox(
        ctx,
        305,
        54,
        155,
        175,
        '#141c2e',
        willOverflow ? '#ff5964' : '#06d6a0',
        2
      );
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 10.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('CAPACIDAD CAMPANA:', 315, 74);
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '10px monospace';
      ctx.fillText(`Máx. campana: 50.0 mL`, 315, 95);
      ctx.fillText(`Masa muestra: ${(state.sampleMassG * 1000).toFixed(0)} mg`, 315, 114);
      ctx.fillStyle = willOverflow ? '#ff5964' : '#06d6a0';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`V estimado: ~${expectedVolMl.toFixed(1)} mL`, 315, 136);
      ctx.fillText(
        willOverflow ? '⚠️ ¡EXCESO DE MASA!' : '✓ Dentro de escala',
        315,
        156
      );
      ctx.fillStyle = '#cbd5e0';
      ctx.font = '9.5px monospace';
      ctx.fillText(
        willOverflow
          ? 'Superará los 50 mL y'
          : 'Subí el slider > 240 mg',
        315,
        178
      );
      ctx.fillText(
        willOverflow
          ? 'desbordará la campana.'
          : 'si querés ver desborde.',
        315,
        192
      );
      return;
    }

    // Lupa graduada de la campana colectora (0 a 50 mL) siempre visible en etapas 1, 3, 4 y 5
    drawZoomedBellScale(ctx, 308, 48, 122, 198, currentGasVolMl, currentUnclampedMl, currentWaterColCm, isCurrentlyOverflowing);

    // =========================================================================
    // 4. PANEL DERECHO (x = 442 a 744): DATOS O PIZARRA DE CÁLCULOS
    // =========================================================================
    if (state.stage === 'calculos' || state.stage === 'quiz') {
      renderVictorMeyerCalculations(ctx, 442, 48, 304, 198, sub);
    } else {
      window.LabCommon.drawPixelBox(ctx, 442, 48, 304, 198, '#161e2e', '#ffd166', 2);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DATOS EXPERIMENTALES:', 454, 68);

      const pv = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '10.5px monospace';
      ctx.fillText(`Sustancia:   ${sub.name}`, 454, 88);
      ctx.fillText(`Fórm. mín.:  ${sub.empirical} (Te=${sub.bp}°C)`, 454, 105);
      ctx.fillText(`Masa (m):    ${state.ampouleWeighed ? (state.sampleMassG * 1000).toFixed(1) + ' mg (' + state.sampleMassG.toFixed(4) + ' g)' : 'Sin pesar'}`, 454, 122);
      ctx.fillText(`T campana:   ${state.tempAmbC.toFixed(1)} °C (${(state.tempAmbC + 273.15).toFixed(2)} K)`, 454, 139);
      ctx.fillText(`P_v(H₂O):    ${pv.toFixed(2)} mmHg`, 454, 156);
      ctx.fillText(`P_atm:       ${state.patmMmHg.toFixed(1)} mmHg`, 454, 173);

      ctx.fillStyle = isCurrentlyOverflowing ? '#ff5964' : (state.vaporizationDone || state.vaporizingAnim) ? '#06d6a0' : '#7bdff2';
      ctx.font = 'bold 10.5px monospace';
      if (state.vaporizingAnim || state.vaporizationDone) {
        ctx.fillText(
          `V leído: ${currentGasVolMl.toFixed(2)} mL | h: ${currentWaterColCm.toFixed(1)} cm`,
          454,
          196
        );
        if (isCurrentlyOverflowing) {
          ctx.fillStyle = '#ff5964';
          ctx.fillText(
            `⚠️ Desborde: se generaron ${currentUnclampedMl.toFixed(1)} mL`,
            454,
            214
          );
          ctx.fillText(
            `pero la campana sólo retiene 50.0 mL`,
            454,
            230
          );
        } else {
          ctx.fillStyle = '#ffd166';
          ctx.fillText(
            state.vaporizingAnim ? '⏳ Burbujeando aire desplazado...' : '✓ Nivel estabilizado en campana',
            454,
            218
          );
        }
      } else {
        ctx.fillText(
          `Baño: ${state.bathBoiling ? '100°C (Régimen)' : 'Frío'} | Purga: ${state.tubePurged ? '3/3 OK' : state.purgeCount + '/3'}`,
          454,
          202
        );
      }
    }
  }

  /**
   * Dibuja un zoom detallado de la campana graduada (0 a 50 mL) mostrando el descenso del menisco
   */
  function drawZoomedBellScale(ctx, x, y, w, h, gasVolMl, unclampedMl, waterColCm, isOverflow) {
    window.LabCommon.drawPixelBox(ctx, x, y, w, h, '#101827', isOverflow ? '#ff5964' : '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LUPA CAMPANA', x + w / 2, y + 16);

    const tubeX = x + 28;
    const tubeY = y + 26;
    const tubeW = 38;
    const tubeH = 140;

    const gasH = (Math.min(MAX_BELL_VOL_ML, gasVolMl) / MAX_BELL_VOL_ML) * tubeH;
    const meniscusY = tubeY + gasH;

    // Zona superior con aire desplazado
    ctx.fillStyle = isOverflow ? 'rgba(255, 89, 100, 0.30)' : 'rgba(255, 255, 255, 0.20)';
    ctx.fillRect(tubeX, tubeY, tubeW, gasH);

    // Zona inferior con agua
    ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.fillRect(tubeX, meniscusY, tubeW, Math.max(0, tubeH - gasH));

    // Menisco cóncavo del agua
    if (gasVolMl > 0.2) {
      ctx.strokeStyle = isOverflow ? '#ff5964' : '#ffd166';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tubeX, meniscusY);
      ctx.quadraticCurveTo(tubeX + tubeW / 2, meniscusY + 4, tubeX + tubeW, meniscusY);
      ctx.stroke();
    }

    // Contorno del tubo graduado
    ctx.strokeStyle = '#f8f9fa';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);

    // Marcas de graduación de 0 a 50 mL
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    for (let ml = 0; ml <= 50; ml += 10) {
      const my = tubeY + (ml / 50.0) * tubeH;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(tubeX, my, 10, 1.2);
      ctx.fillText(`${ml}`, tubeX + tubeW + 5, my + 3);
    }

    // Lectura digital al pie de la lupa
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = isOverflow ? '#ff5964' : '#06d6a0';
    ctx.fillText(`V = ${gasVolMl.toFixed(1)} mL`, x + w / 2, y + h - 18);
    ctx.fillStyle = '#ffd166';
    ctx.font = '9.5px monospace';
    ctx.fillText(
      isOverflow ? `¡Escaparon ${(unclampedMl - 50).toFixed(1)} mL!` : `h = ${waterColCm.toFixed(1)} cm H₂O`,
      x + w / 2,
      y + h - 6
    );
  }

  /**
   * Pizarra compacta de resultados en el lado derecho del Canvas, manteniendo visible la campana a la izquierda
   */
  function renderVictorMeyerCalculations(ctx, x, y, w, h, sub) {
    const calc = state.calculated || performCalculations();

    window.LabCommon.drawPixelBox(ctx, x, y, w, h, '#151c2c', state.bellOverflowed ? '#ff5964' : '#ffd166', 2);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PIZARRA DE RESULTADOS (VM):', x + 12, y + 18);

    const lx = x + 12;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#f8f9fa';
    ctx.fillText(`Masa m = ${state.sampleMassG.toFixed(4)} g | V = ${state.collectedVolMl.toFixed(2)} mL`, lx, y + 36);
    ctx.fillText(`P_atm = ${state.patmMmHg.toFixed(1)} | P_v = ${calc.pvUsedMmHg.toFixed(1)} mmHg`, lx, y + 52);

    ctx.fillStyle = state.calcSolved.ph_mmhg ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `1) P_h (h/13.6):   ${state.calcSolved.ph_mmhg ? calc.phUsedMmHg.toFixed(2) + ' mmHg' : '[ ? Calcular abajo ]'}`,
      lx,
      y + 72
    );

    ctx.fillStyle = state.calcSolved.p_seco_atm ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `2) P_seco:         ${state.calcSolved.p_seco_atm ? calc.pGasCorrAtm.toFixed(4) + ' atm' : '[ ? Calcular abajo ]'}`,
      lx,
      y + 90
    );

    ctx.fillStyle = state.calcSolved.n_mmol ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `3) Moles n:        ${state.calcSolved.n_mmol ? (calc.molesCalc * 1000).toFixed(4) + ' mmol' : '[ ? Calcular abajo ]'}`,
      lx,
      y + 108
    );

    ctx.fillStyle = state.calcSolved.mw_exp ? '#ffd166' : '#ff9f1c';
    ctx.font = 'bold 10.5px monospace';
    ctx.fillText(
      `4) PM_exp:         ${state.calcSolved.mw_exp ? calc.mwExp.toFixed(2) + ' g/mol' : '[ ? Calcular abajo ]'}`,
      lx,
      y + 128
    );

    ctx.fillStyle = '#cbd5e0';
    ctx.font = '10px monospace';
    ctx.fillText(`   PM_teórico:     ${calc.mwTeo.toFixed(2)} g/mol (${sub.formula})`, lx, y + 145);

    ctx.fillStyle = state.calcSolved.mult_n ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(
      `5) Fórm. Molec.:   ${state.calcSolved.mult_n ? calc.deducedFormula : '[ ? Calcular n ]'}`,
      lx,
      y + 164
    );

    const errAbs = Math.abs(calc.relErrPercent);
    ctx.fillStyle = !state.calcSolved.mw_exp
      ? '#ff9f1c'
      : errAbs < 3.0
      ? '#06d6a0'
      : '#ff5964';
    ctx.fillText(
      `Error relativo PM: ${
        state.calcSolved.mw_exp ? (calc.relErrPercent >= 0 ? '+' : '') + calc.relErrPercent.toFixed(2) + ' %' : '[ ? ]'
      }${state.bellOverflowed ? ' (¡Por desborde!)' : ''}`,
      lx,
      y + 184
    );
  }

  return {
    SUBSTANCES: SUBSTANCES,
    MAX_BELL_VOL_ML: MAX_BELL_VOL_ML,

    getState: function () {
      return state;
    },

    reset: function () {
      state = createInitialState();
    },

    getCurrentSubstance: getCurrentSubstance,
    computeCollectedVolume: computeCollectedVolume,
    performCalculations: performCalculations,
    renderScene: renderScene,

    getHudInfo: function () {
      const sub = getCurrentSubstance();
      return [
        { label: 'TP Actual:', value: '3. Método de Víctor Meyer' },
        { label: 'Muestra:', value: `${sub.name} (${sub.empirical})` },
        { label: 'Masa m:', value: state.ampouleWeighed ? `${(state.sampleMassG * 1000).toFixed(1)} mg` : 'Pendiente' },
        { label: 'PM_exp:', value: state.calculated && state.calcSolved.mw_exp ? `${state.calculated.mwExp.toFixed(1)} g/mol` : 'Pendiente' },
        { label: 'Puntaje:', value: `${state.score} pts` }
      ];
    },

    getLogbookData: function () {
      const sub = getCurrentSubstance();
      const calc = state.calculated;
      const pv = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);
      const headers = ['Parámetro / Magnitud', 'Expresión', 'Valor', 'Unidad'];
      const rows = [
        ['Sustancia analizada', 'Muestra volátil', sub.name, `FM: ${sub.empirical}`],
        ['Punto de ebullición normal', 'T_eb (< 100 °C)', sub.bp.toFixed(1), '°C'],
        ['Masa de líquido en ampollita', 'm', state.ampouleWeighed ? state.sampleMassG.toFixed(4) : 'Pendiente', 'g'],
        ['Temperatura en campana colectora', 'T', state.tempAmbC.toFixed(1), '°C'],
        ['Presión atmosférica (Fortín)', 'P_atm', state.patmMmHg.toFixed(1), 'mmHg'],
        ['Presión de vapor del agua a T', 'P_v(H₂O)', pv.toFixed(2), 'mmHg'],
        ['Altura columna de agua en campana', 'h', state.vaporizationDone ? state.waterColumnCm.toFixed(1) : 'Pendiente', 'cm H₂O'],
        [
          'Volumen de aire en campana',
          'V',
          state.vaporizationDone
            ? `${state.collectedVolMl.toFixed(2)}${state.bellOverflowed ? ' (Desbordó: real ' + state.unclampedVolMl.toFixed(1) + ')' : ''}`
            : 'Pendiente',
          'mL'
        ]
      ];

      if (calc) {
        rows.push(
          ['Presión parcial del aire seco', 'P = P_atm - P_v - h/13.6', calc.pGasCorrMmHg.toFixed(2), 'mmHg'],
          ['Moles desplazados', 'n = P·V / (R·T)', (calc.molesCalc * 1000).toFixed(4), 'mmol'],
          ['Peso Molecular Experimental', 'M_exp = m / n', calc.mwExp.toFixed(2), 'g/mol'],
          ['Peso Molecular Teórico', 'M_teo', calc.mwTeo.toFixed(2), 'g/mol'],
          ['Fórmula Molecular deducida', '(Fórm. Mín.)_n', calc.deducedFormula, '---'],
          ['Error relativo porcentual', 'Er %', calc.relErrPercent.toFixed(2), '%']
        );
      }

      return {
        title: `Método de Víctor Meyer — Muestra: ${sub.name}`,
        metaHtml: `<strong>Muestra:</strong> ${sub.name} (${sub.composition}) &nbsp;|&nbsp; <strong>Fórmula Mínima:</strong> ${sub.empirical} &nbsp;|&nbsp; <strong>Baño calefactor:</strong> Agua en ebullición (100 °C)`,
        headers: headers,
        rows: rows,
        metaLines: [
          `Muestra empleada: ${sub.name} (Fórmula mínima: ${sub.empirical})`,
          `Condiciones ambientales: T = ${state.tempAmbC.toFixed(1)} °C, P_atm = ${state.patmMmHg.toFixed(1)} mmHg`,
          `Purgado de aire previo: ${state.tubePurged && !state.errors.skipPurge ? 'Correcto' : 'Deficiente'}`
        ],
        conclusionLines: calc
          ? [
              `Volumen de aire recogido sobre agua: ${state.collectedVolMl.toFixed(2)} mL${state.bellOverflowed ? ' (DESBORDE de campana: se perdió exceso de gas)' : ''}`,
              `Presión corregida del gas seco: ${calc.pGasCorrAtm.toFixed(4)} atm`,
              `Peso Molecular Experimental: ${calc.mwExp.toFixed(2)} g/mol (Teórico: ${calc.mwTeo.toFixed(2)} g/mol)`,
              `Fórmula Molecular determinada: ${calc.deducedFormula} (Error: ${calc.relErrPercent.toFixed(2)} %)`
            ]
          : ['Cálculos pendientes de completar la vaporización y lectura en campana.']
      };
    }
  };
})();
