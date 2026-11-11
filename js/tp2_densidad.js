/**
 * tp2_densidad.js
 * Trabajo Práctico 2: Determinación de la Densidad de Gases (CO2)
 * (Guía IQ 2019, Págs. 40-43)
 * Incluye simulación física completa de:
 * - Ampolla de Regnault (~501.5 mL) con dos llaves esmeriladas
 * - Bomba rotatoria de vacío y manómetro
 * - Aparato de Kipp (CaCO3 + 2 HCl -> CaCl2 + CO2 + H2O)
 * - Tren purificador y desecador en serie (Frasco 1: H2O, Frasco 2: H2SO4 conc., Frasco 3: Gel de Sílice)
 * - Giro rápido de 180° de la llave para equilibrar con Patm
 * - Pesadas m0 (vacía), m1 (con CO2) y m2 (con agua destilada hervida)
 * - Simulación rigurosa de errores de procedimiento (Modo Docente y Modo Alumno)
 */

window.TP2_Densidad = (function () {
  const PM_CO2 = 44.01;
  const PM_H2O = 18.015;
  const PM_HCL = 36.46;
  const PM_SO3 = 80.06;
  const PM_AIR = 28.97;
  const R_ATM = 0.082057;
  const DENS_IDEAL_CNTP = PM_CO2 / (R_ATM * 273.15); // 1.9635 g/L

  function createInitialState() {
    return {
      stage: 'vacio', // 'vacio' | 'pesar_m0' | 'kipp_tren' | 'equilibrar_m1' | 'agua_m2' | 'calculos' | 'quiz'
      tempAmbC: 22.0,
      tempAguaC: 21.0,
      patmTorr: 758.0,

      // Propiedades físicas verdaderas de la ampolla de Regnault
      realVolumeMl: 501.50,
      realEmptyMassG: 185.2345,

      // Estado interactivo del experimento
      pumpRunning: false,
      valveAmpAOpen: false,
      valveAmpBOpen: false,
      valveKippOpen: false,
      vacuumDone: false,
      m0Weighed: false,
      kippPurged: false,
      ampollaFilledCo2: false,
      pressureEqualized180: false,
      m1Weighed: false,
      waterFilled: false,
      m2Weighed: false,
      resultsCalculated: false,

      calcSolved: {
        m_agua: false,
        v_ampolla: false,
        m_co2: false,
        delta_exp: false,
        delta_cntp: false,
        err_rel: false
      },

      // Configuración de Errores Experimentales (modificables en Modo Docente o por decisiones del alumno)
      errors: {
        residualPressureCmHg: 0.0,       // 0.0 = vacío óptimo (<0.1 mmHg); >0 deja aire residual en m0 (Error por DEFECTO)
        regnaultLeak: false,             // La ampolla de Regnault pierde un poquito por el robinete (entra aire en m0 -> Error por DEFECTO)
        turnOffPumpBeforeCloseValve: false, // Apagar la bomba antes de cerrar Llave A (reingresa aire -> Error por DEFECTO)
        skipTrainPurge: false,           // No purgar el aire del tren antes de llenar la ampolla (queda aire PM 28.9 < 44 -> DEFECTO)
        wrongValveCloseOrder: false,     // Cerrar primero Kipp antes que la salida a la atmósfera (retrodifunde aire -> DEFECTO)
        skipEqualize180: false,          // Si no gira 180° la llave, queda sobrepresión hidrostática de HCl del Kipp (Error por EXCESO)
        leaveValveOpenTooLong180: false, // Dejar la llave abierta mucho tiempo al equilibrar (escapa CO2 y entra aire -> DEFECTO)
        hclHeadCm: 45.0,                 // Altura de columna de HCl en el Kipp (cm, d=1.09 g/mL)
        missingWaterFlask: false,        // Falta frasco 1 (H2O): pasa HCl(g) arrastrado (PM 36.5 < 44 -> Error por DEFECTO)
        missingH2SO4Flask: false,        // Falta frasco 2 (H2SO4): pasa vapor de agua (PM 18 < 44 -> Error por DEFECTO)
        missingSilicaFlask: false,       // Falta frasco 3 (Sílica): quedan trazas de humedad (Error por DEFECTO)
        so3ImpurityInKipp: false,        // Se genera SO3(g) (PM 80 > 44) no retenido en el tren (Parcial 2023 -> Error por EXCESO)
        unfilledWaterMl: 0.0,            // Volumen sin llenar en cuello al medir m2 (mL)
        airBubblesWaterMl: 0.0,          // Burbujas adheridas al llenar con agua en m2 (mL -> subestima V -> Error por EXCESO)
        wetExteriorM2: false             // Ampolla mojada por fuera al pesar m2 (+m2 -> sobreestima V -> Error por DEFECTO)
      },

      // Registro interactivo del orden de apertura/cierre de llaves en el tren Kipp
      gasFlowingThroughAmpolla: false,
      closeSequenceLog: [],

      // Valores medidos en balanza y resultados calculados
      measured: {
        m0_g: null,
        m1_g: null,
        m2_g: null,
        masaAireResidual_g: 0,
        masaImpurezas_g: 0,
        P_gasAmpolla_torr: 758.0
      },

      calculated: null,
      score: 0
    };
  }

  let state = createInitialState();

  function idealGasMassG(volL, tempK, pAtm, mw) {
    if (volL <= 0 || tempK <= 0 || pAtm <= 0) return 0;
    const n = (pAtm * volL) / (R_ATM * tempK);
    return n * mw;
  }

  /**
   * Calcula la masa m0 al pesar la ampolla tras hacer vacío
   */
  function computeM0() {
    const volL = state.realVolumeMl / 1000.0;
    const tempK = state.tempAmbC + 273.15;
    let pResTorr = Math.max(0, state.errors.residualPressureCmHg * 10.0);

    // Si la ampolla de Regnault pierde un poquito por el robinete (microfuga), entra aire lentamente (~68 mmHg)
    if (state.errors.regnaultLeak) {
      pResTorr += 68.0;
    }
    // Si apagó la bomba antes de cerrar la Llave A, reingresa aire a la ampolla (~95 mmHg)
    if (state.errors.turnOffPumpBeforeCloseValve) {
      pResTorr += 95.0;
    }

    const pResAtm = Math.min(state.patmTorr, pResTorr) / 760.0;

    const mAirRes = idealGasMassG(volL, tempK, pResAtm, PM_AIR);
    state.measured.masaAireResidual_g = mAirRes;
    state.measured.m0_g = state.realEmptyMassG + mAirRes;
    return state.measured.m0_g;
  }

  /**
   * Calcula la masa m1 al pesar la ampolla llena de CO2 (considerando presión del Kipp y pureza del tren)
   */
  function computeM1() {
    if (state.measured.m0_g === null) computeM0();
    const volL = state.realVolumeMl / 1000.0;
    const tempK = state.tempAmbC + 273.15;

    // Sobrepresión hidrostática de la solución de HCl en el aparato de Kipp (~1.09 g/cm³)
    let overpressureTorr = 0;
    if (state.errors.skipEqualize180) {
      // P = rho * g * h -> en mmHg: h_cm * (1.09 / 13.595) * 10
      overpressureTorr = state.errors.hclHeadCm * (1.09 / 13.5951) * 10.0;
    }

    const pTotalTorr = state.patmTorr + overpressureTorr;
    state.measured.P_gasAmpolla_torr = pTotalTorr;

    // Presiones parciales de impurezas si se eliminan frascos en el tren de lavado
    const pvWaterSatTorr = window.LabCommon.getWaterVaporPressureTorr(state.tempAmbC);
    let pWaterTorr = 0;
    if (state.errors.missingH2SO4Flask && state.errors.missingSilicaFlask) {
      pWaterTorr = pvWaterSatTorr * 0.95; // Sin ningún desecador: gas casi saturado de vapor de H2O (PM = 18.015)
    } else if (state.errors.missingH2SO4Flask) {
      pWaterTorr = pvWaterSatTorr * 0.60; // Sin H2SO4 la sílica gel sola no alcanza y se satura rápido
    } else if (state.errors.missingSilicaFlask) {
      pWaterTorr = pvWaterSatTorr * 0.22; // Sin sílica gel pasan trazas de humedad residual
    }

    let pHClTorr = 0;
    if (state.errors.missingWaterFlask) {
      pHClTorr = pTotalTorr * 0.06; // 6% de arrastre ácido de HCl gaseoso (PM = 36.46 < 44)
    }

    let pSO3Torr = 0;
    if (state.errors.so3ImpurityInKipp) {
      pSO3Torr = pTotalTorr * 0.06; // 6% de SO3 gaseoso no retenido (PM = 80.06 > 44)
    }

    // Aire residual / infiltrado por errores de purga, orden de cierre de llaves, microfuga o llave abierta de más
    let pResTorr = Math.max(0, state.errors.residualPressureCmHg * 10.0) * 0.25;
    if (state.errors.skipTrainPurge) {
      pResTorr += pTotalTorr * 0.085; // 8.5% de aire del tren que no fue purgado (PM = 28.97 < 44)
    }
    if (state.errors.wrongValveCloseOrder) {
      pResTorr += pTotalTorr * 0.065; // Al cerrar Kipp antes que la salida a la atmósfera, retrodifunde aire
    }
    if (state.errors.leaveValveOpenTooLong180) {
      pResTorr += pTotalTorr * 0.075; // Al dejar abierta la llave varios minutos en el giro de 180°, escapa CO2 y entra aire
    }
    if (state.errors.regnaultLeak) {
      pResTorr += pTotalTorr * 0.035; // Difusión lenta por el robinete con pérdida
    }

    const pCO2Torr = Math.max(0, pTotalTorr - pWaterTorr - pHClTorr - pSO3Torr - pResTorr);

    const mCO2 = idealGasMassG(volL, tempK, pCO2Torr / 760.0, PM_CO2);
    const mWater = idealGasMassG(volL, tempK, pWaterTorr / 760.0, PM_H2O);
    const mHCl = idealGasMassG(volL, tempK, pHClTorr / 760.0, PM_HCL);
    const mSO3 = idealGasMassG(volL, tempK, pSO3Torr / 760.0, PM_SO3);
    const mAirRem = idealGasMassG(volL, tempK, pResTorr / 760.0, PM_AIR);

    state.measured.masaImpurezas_g = mWater + mHCl + mSO3 + mAirRem;
    state.measured.m1_g = state.realEmptyMassG + mCO2 + state.measured.masaImpurezas_g;
    return state.measured.m1_g;
  }

  /**
   * Calcula la masa m2 al pesar la ampolla llena de agua destilada hervida y enfriada
   */
  function computeM2() {
    if (state.measured.m0_g === null) computeM0();
    if (state.measured.m1_g === null) computeM1();

    const rhoWater = window.LabCommon.getWaterDensity(state.tempAguaC);
    const effectiveWaterVolMl = Math.max(
      100,
      state.realVolumeMl - state.errors.unfilledWaterMl - state.errors.airBubblesWaterMl
    );
    const waterMassG = effectiveWaterVolMl * rhoWater;
    const wetExteriorBonusG = state.errors.wetExteriorM2 ? 4.80 : 0.0; // Gotas de agua sin secar por fuera (+4.8 g -> sobreestima V -> DEFECTO)

    state.measured.m2_g = state.realEmptyMassG + waterMassG + wetExteriorBonusG;
    return state.measured.m2_g;
  }

  /**
   * Realiza todos los cálculos experimentales según las fórmulas de la Guía IQ 2019 (pág. 42)
   */
  function performFinalCalculations() {
    computeM0();
    computeM1();
    computeM2();

    const m0 = state.measured.m0_g;
    const m1 = state.measured.m1_g;
    const m2 = state.measured.m2_g;
    const rhoAgua = window.LabCommon.getWaterDensity(state.tempAguaC);

    // El alumno calcula con sus pesadas m0, m1 y m2:
    const mAguaAparenteG = m2 - m0;
    const vAmpollaMl = mAguaAparenteG / rhoAgua;
    const vAmpollaL = vAmpollaMl / 1000.0;

    const mGasAparenteG = m1 - m0;
    const deltaExpGL = mGasAparenteG / vAmpollaL;

    // Corrección a CNTP (273.15 K y 1 atm = 760 torr) usando ley de gases ideales:
    // delta_CNTP = delta_exp * (T_amb / 273.15) * (760 / P_atm)
    const tempAmbK = state.tempAmbC + 273.15;
    const deltaCntpExpGL = deltaExpGL * (tempAmbK / 273.15) * (760.0 / state.patmTorr);

    // Densidad teórica ideal a las condiciones del laboratorio (T_amb, P_atm)
    const deltaTeoAmbGL = (PM_CO2 * (state.patmTorr / 760.0)) / (R_ATM * tempAmbK);

    // Error relativo porcentual respecto a CNTP tabulado (1.9635 g/L)
    const relErrorPercent = ((deltaCntpExpGL - DENS_IDEAL_CNTP) / DENS_IDEAL_CNTP) * 100.0;

    state.calculated = {
      rhoAgua,
      mAguaAparenteG,
      vAmpollaMl,
      mGasAparenteG,
      deltaExpGL,
      deltaTeoAmbGL,
      deltaCntpExpGL,
      deltaIdealCntpGL: DENS_IDEAL_CNTP,
      relErrorPercent
    };
    state.resultsCalculated = true;
    return state.calculated;
  }

  /**
   * Renderizador gráfico en Canvas 2D para cada etapa de Densidad de Gases
   */
  function renderScene(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const tick = window.LabCommon.nextTick();

    let banner = 'TP 2: DETERMINACIÓN DE LA DENSIDAD DE GASES (CO₂)';
    if (state.stage === 'vacio' || state.stage === 'pesar_m0') {
      banner = 'ETAPA 1: EVACUACIÓN DE LA AMPOLLA DE REGNAULT Y PESADA m₀';
    } else if (state.stage === 'kipp_tren') {
      banner = 'ETAPA 2: APARATO DE KIPP Y TREN PURIFICADOR / DESECADOR DE CO₂';
    } else if (state.stage === 'equilibrar_m1') {
      banner = 'ETAPA 3: EQUILIBRADO DE PRESIÓN (GIRO 180°) Y PESADA m₁ CON CO₂';
    } else if (state.stage === 'agua_m2') {
      banner = 'ETAPA 4: LLENADO CON AGUA DESTILADA HERVIDA Y PESADA m₂';
    } else if (state.stage === 'calculos' || state.stage === 'quiz') {
      banner = 'ETAPA 5: DETERMINACIÓN DE DENSIDAD EXPERIMENTAL Y CORRECCIÓN A CNTP';
    }

    window.LabCommon.drawLabBackground(ctx, w, h, banner);

    if (state.stage === 'vacio' || state.stage === 'pesar_m0') {
      renderVacuumAndM0Scene(ctx, w, h, tick);
    } else if (state.stage === 'kipp_tren') {
      renderKippTrainScene(ctx, w, h, tick);
    } else if (state.stage === 'equilibrar_m1') {
      renderEqualizeAndM1Scene(ctx, w, h, tick);
    } else if (state.stage === 'agua_m2') {
      renderWaterAndM2Scene(ctx, w, h);
    } else {
      renderCalculationsBoard(ctx, w, h);
    }
  }

  function renderVacuumAndM0Scene(ctx, w, h, tick) {
    const benchY = h - 62;

    // 1. Bomba rotatoria de vacío a la izquierda (Clicable)
    window.LabCommon.drawPixelBox(
      ctx,
      48,
      benchY - 78,
      125,
      78,
      '#2b3448',
      state.pumpRunning ? '#06d6a0' : '#9aa5b1',
      2
    );
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOMBA DE VACÍO', 110, benchY - 58);

    // Polea rotatoria animada
    const wheelAngle = state.pumpRunning ? tick * 0.25 : 0;
    ctx.save();
    ctx.translate(110, benchY - 30);
    ctx.rotate(wheelAngle);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    ctx.strokeStyle = state.pumpRunning ? '#06d6a0' : state.vacuumDone ? '#7bdff2' : '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = state.pumpRunning ? '#06d6a0' : '#cbd5e0';
    ctx.font = '9px monospace';
    ctx.fillText(state.pumpRunning ? '[ON - Clic: Apagar]' : '[OFF - Clic: Encender]', 110, benchY + 14);

    // Manómetro de vacío
    let pResMm = state.vacuumDone || state.pumpRunning ? state.errors.residualPressureCmHg * 10.0 : state.patmTorr;
    if (state.errors.regnaultLeak && (state.vacuumDone || state.pumpRunning)) {
      pResMm += 68.0;
    }
    if (state.errors.turnOffPumpBeforeCloseValve) {
      pResMm += 95.0;
    }
    window.LabCommon.drawPixelBox(ctx, 195, benchY - 115, 115, 58, '#161e2e', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('MANÓMETRO VACÍO', 252, benchY - 98);
    ctx.fillStyle = pResMm <= 0.5 ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      state.vacuumDone || state.pumpRunning
        ? pResMm <= 0.1
          ? '< 0.1 mmHg'
          : `${pResMm.toFixed(1)} mmHg`
        : `${state.patmTorr.toFixed(0)} mmHg`,
      252,
      benchY - 74
    );

    // Ampolla de Regnault conectada al tren de vacío (centro)
    const ampX = 390, ampY = benchY - 62;
    // Manguera de vacío
    ctx.strokeStyle = state.pumpRunning && state.valveAmpAOpen ? '#06d6a0' : '#6c757d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(173, benchY - 50);
    ctx.lineTo(252, benchY - 50);
    ctx.lineTo(252, benchY - 57);
    ctx.moveTo(252, benchY - 50);
    ctx.lineTo(ampX - 48, ampY);
    ctx.stroke();

    const hasAirLeakOrRes =
      state.errors.residualPressureCmHg > 0 ||
      state.errors.regnaultLeak ||
      state.errors.turnOffPumpBeforeCloseValve;

    // Esfera de vidrio de la ampolla de Regnault
    ctx.beginPath();
    ctx.arc(ampX, ampY, 34, 0, Math.PI * 2);
    ctx.fillStyle = state.vacuumDone
      ? hasAirLeakOrRes
        ? 'rgba(255, 159, 28, 0.25)'
        : 'rgba(6, 214, 160, 0.10)'
      : 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
    ctx.strokeStyle = hasAirLeakOrRes ? '#ff9f1c' : '#f1faee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (state.errors.regnaultLeak) {
      // Animación de microfuga en el robinete de la ampolla de Regnault
      const leakOffset = (tick * 1.5) % 18;
      ctx.fillStyle = '#ff5964';
      ctx.beginPath();
      ctx.arc(ampX - 36 + leakOffset * 0.7, ampY - 12 + leakOffset * 0.3, 2.5, 0, Math.PI * 2);
      ctx.arc(ampX - 28 + leakOffset * 0.5, ampY - 6 + leakOffset * 0.4, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5964';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💨 Pierde un poquito (entra aire)', ampX, ampY - 58);
    }

    if (hasAirLeakOrRes && (state.vacuumDone || state.m0Weighed)) {
      ctx.fillStyle = '#ff9f1c';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.errors.regnaultLeak ? '⚠️ Entra aire (+m₀)' : '⚠️ Aire residual', ampX, ampY + 3);
    }

    // Dos llaves de vidrio esmerilado (Clicables individualmente)
    window.LabCommon.drawStopcock(ctx, ampX - 42, ampY, state.valveAmpAOpen, 'Llave A');
    window.LabCommon.drawStopcock(ctx, ampX + 42, ampY, state.valveAmpBOpen, 'Llave B');

    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('Ampolla de Regnault', ampX, ampY - 44);
    ctx.fillStyle = '#ffd166';
    ctx.font = '9.5px monospace';
    ctx.fillText('[Clic en Bomba / Llave A / Llave B para operar]', ampX, ampY + 50);

    // Balanza analítica a la derecha para pesar m0
    const m0Str = state.m0Weighed && state.measured.m0_g !== null
      ? `${state.measured.m0_g.toFixed(4)} g`
      : '0.0000 g';
    window.LabCommon.drawAnalyticalBalance(
      ctx,
      625,
      benchY,
      m0Str,
      'BALANZA ANALÍTICA (m₀)',
      state.m0Weighed ? 'ampolla_vacia' : 'none'
    );
  }

  function renderKippTrainScene(ctx, w, h, tick) {
    const benchY = h - 62;
    const isFlowing = state.valveKippOpen && state.valveAmpAOpen && state.valveAmpBOpen;
    const isKippBlocked = state.valveKippOpen && (!state.valveAmpAOpen || !state.valveAmpBOpen);

    // 1. APARATO DE KIPP (Izquierda: x = 95)
    const kx = 95;
    // Bulbo inferior (HCl)
    ctx.fillStyle = 'rgba(250, 204, 21, 0.30)';
    ctx.beginPath();
    ctx.arc(kx, benchY - 26, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f1faee';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bulbo intermedio (piedras de mármol CaCO3 + gas CO2)
    ctx.fillStyle = isFlowing || state.kippPurged ? 'rgba(6, 214, 160, 0.22)' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(kx, benchY - 74, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Piedras de CaCO3 (mármol) en bulbo intermedio
    ctx.fillStyle = '#e2e8f0';
    for (let i = -14; i <= 14; i += 7) {
      ctx.fillRect(kx + i - 3, benchY - 64, 6, 5);
    }

    // Bulbo superior con vástago largo cónico (si hay sobrepresión sube el nivel de HCl)
    ctx.fillStyle = isKippBlocked ? 'rgba(250, 204, 21, 0.65)' : 'rgba(250, 204, 21, 0.35)';
    ctx.beginPath();
    ctx.arc(kx, benchY - 128, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tubo cónico interno del Kipp
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kx - 3, benchY - 108);
    ctx.lineTo(kx - 3, benchY - 14);
    ctx.moveTo(kx + 3, benchY - 108);
    ctx.lineTo(kx + 3, benchY - 14);
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('APARATO DE KIPP', kx, benchY - 156);
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '9px monospace';
    ctx.fillText('CaCO₃ + 2HCl', kx, benchY + 15);

    // Llave de salida del Kipp (Clicable)
    window.LabCommon.drawStopcock(ctx, kx + 34, benchY - 78, state.valveKippOpen, 'Llave Kipp');

    // 2. TREN PURIFICADOR Y DESECADOR (3 Frascos lavadores en serie, clicables para eliminar/colocar)
    const silicaSaturated = state.errors.missingH2SO4Flask && !state.errors.missingSilicaFlask;
    const flasks = [
      {
        x: 225,
        title: '1. H₂O(l)',
        sub: 'Retiene HCl(g)',
        color: 'rgba(56, 189, 248, 0.48)',
        missing: state.errors.missingWaterFlask,
        leakLabel: 'Pasa HCl(g)'
      },
      {
        x: 335,
        title: '2. H₂SO₄(c)',
        sub: 'Deshidratante',
        color: 'rgba(253, 224, 71, 0.45)',
        missing: state.errors.missingH2SO4Flask,
        leakLabel: 'Pasa H₂O(v)'
      },
      {
        x: 445,
        title: '3. Sílica Gel',
        sub: silicaSaturated ? '¡Saturada H₂O!' : 'Secado final',
        color: silicaSaturated ? 'rgba(244, 114, 182, 0.55)' : 'rgba(96, 165, 250, 0.52)',
        missing: state.errors.missingSilicaFlask,
        leakLabel: 'Trazas H₂O(v)'
      }
    ];

    // Panel superior: Monitor de estado del tren lavador y de las 3 llaves
    const anyFlaskMissing =
      state.errors.missingWaterFlask || state.errors.missingH2SO4Flask || state.errors.missingSilicaFlask;
    const anyOrderErr =
      state.errors.skipTrainPurge || state.errors.wrongValveCloseOrder || state.errors.regnaultLeak;
    window.LabCommon.drawPixelBox(
      ctx,
      172,
      44,
      368,
      58,
      '#131b2e',
      anyFlaskMissing || anyOrderErr ? '#ff5964' : '#06d6a0',
      1.8
    );
    ctx.textAlign = 'left';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(
      `LLAVES: Kipp[${state.valveKippOpen ? 'ABIERTA' : 'CERRADA'}] · Entrada A[${state.valveAmpAOpen ? 'ABIERTA' : 'CERRADA'}] · Salida B[${state.valveAmpBOpen ? 'ABIERTA' : 'CERRADA'}]`,
      180,
      59
    );

    ctx.font = '9.2px monospace';
    if (!anyFlaskMissing && !anyOrderErr) {
      ctx.fillStyle = '#06d6a0';
      ctx.fillText('✓ 3 Frascos activos → Entra 100% CO₂ seco (PM = 44.0 g/mol)', 180, 74);
      ctx.fillStyle = '#cbd5e0';
      ctx.fillText('Clic en cada Llave o Frasco en la mesada para operar.', 180, 89);
    } else {
      const leaks = [];
      if (state.errors.missingWaterFlask) leaks.push('HCl(g)[36.5]');
      if (state.errors.missingH2SO4Flask || state.errors.missingSilicaFlask) leaks.push('H₂O(v)[18]');
      if (state.errors.skipTrainPurge) leaks.push('Aire sin purgar[28.9]');
      if (state.errors.wrongValveCloseOrder) leaks.push('Retrodifusión aire[28.9]');
      if (state.errors.regnaultLeak) leaks.push('Pérdida robinete');
      ctx.fillStyle = '#ff5964';
      ctx.fillText(`⚠️ Impurezas: ${leaks.join(' + ')}`, 180, 74);
      ctx.fillStyle = '#ff9f1c';
      ctx.fillText('Gases más livianos que CO₂ (44) → m₁ baja → δ por DEFECTO', 180, 89);
    }

    flasks.forEach((f, idx) => {
      // Tubo de conexión desde el elemento previo
      const prevX = idx === 0 ? kx + 42 : flasks[idx - 1].x + 22;
      ctx.strokeStyle = isFlowing ? '#06d6a0' : '#9aa5b1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(prevX, benchY - 78);
      ctx.lineTo(f.x - 22, benchY - 78);
      ctx.stroke();

      if (!f.missing) {
        // Frasco lavador de Dreschel instalado
        window.LabCommon.drawPixelBox(
          ctx,
          f.x - 24,
          benchY - 72,
          48,
          68,
          'rgba(255, 255, 255, 0.08)',
          silicaSaturated && idx === 2 ? '#f472b6' : '#e2e8f0',
          2
        );

        ctx.fillStyle = f.color;
        ctx.fillRect(f.x - 22, benchY - 44, 44, 38);

        // Vástago buzo sumergido en el líquido/sílica
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(f.x - 10, benchY - 78);
        ctx.lineTo(f.x - 10, benchY - 14);
        ctx.stroke();

        // Burbujeo animado cuando circula CO2
        if (isFlowing || (state.valveKippOpen && !state.ampollaFilledCo2)) {
          const by = benchY - 12 - ((tick * 2 + idx * 11) % 30);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x - 4, by, 3, 0, Math.PI * 2);
          ctx.arc(f.x + 6, by - 6, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Frasco ELIMINADO: contorno fantasma punteado + manguera de puente directo (BYPASS)
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 89, 100, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(f.x - 24, benchY - 72, 48, 68);
        ctx.restore();

        // Manguera de puente directo arriba
        ctx.strokeStyle = '#ff5964';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(f.x - 24, benchY - 78);
        ctx.lineTo(f.x + 24, benchY - 78);
        ctx.stroke();

        ctx.fillStyle = '#ff5964';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ELIMINADO', f.x, benchY - 44);
        ctx.fillStyle = '#ff9f1c';
        ctx.font = '8.5px monospace';
        ctx.fillText(f.leakLabel, f.x, benchY - 28);
        ctx.fillStyle = '#ffd166';
        ctx.fillText('[Clic: Poner]', f.x, benchY - 12);
      }

      ctx.fillStyle = f.missing ? '#ff5964' : '#7bdff2';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.title, f.x, benchY - 88);
      ctx.fillStyle = f.missing ? '#ff9f1c' : '#a0aec0';
      ctx.font = '9px monospace';
      ctx.fillText(f.missing ? '[Clic: Colocar]' : '[Clic: Eliminar]', f.x, benchY + 15);
    });

    // 3. AMPOLLA DE REGNAULT CONECTADA AL FINAL DEL TREN (Derecha: x = 615)
    const ax = 615, ay = benchY - 58;
    ctx.strokeStyle = anyFlaskMissing ? '#ff9f1c' : isFlowing ? '#06d6a0' : '#9aa5b1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(469, benchY - 78);
    ctx.lineTo(ax - 52, ay);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ax, ay, 36, 0, Math.PI * 2);
    ctx.fillStyle = state.ampollaFilledCo2 || isFlowing
      ? anyFlaskMissing || anyOrderErr
        ? 'rgba(255, 159, 28, 0.26)'
        : 'rgba(6, 214, 160, 0.28)'
      : 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = anyFlaskMissing || anyOrderErr ? '#ff9f1c' : '#f1faee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Si se eliminaron frascos desecadores, mostrar gotitas de vapor/humedad en la ampolla
    if ((isFlowing || state.kippPurged || state.ampollaFilledCo2) && (state.errors.missingH2SO4Flask || state.errors.missingSilicaFlask)) {
      ctx.fillStyle = '#38bdf8';
      [[-16, -14], [15, -12], [-18, 12], [16, 14]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(ax + dx, ay + dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (state.errors.regnaultLeak) {
      ctx.fillStyle = '#ff5964';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💨 Pierde un poquito', ax, ay - 62);
    }

    window.LabCommon.drawStopcock(ctx, ax - 44, ay, state.valveAmpAOpen, 'Llave A (Ent)');
    window.LabCommon.drawStopcock(ctx, ax + 44, ay, state.valveAmpBOpen, 'Llave B (Sal)');

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('AMPOLLA REGNAULT', ax, ay - 46);
    ctx.fillStyle = isFlowing
      ? '#06d6a0'
      : state.ampollaFilledCo2
      ? anyFlaskMissing || anyOrderErr
        ? '#ff9f1c'
        : '#06d6a0'
      : '#cbd5e0';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(
      isFlowing
        ? 'CIRCULANDO CO₂...'
        : state.ampollaFilledCo2
        ? anyFlaskMissing || anyOrderErr
          ? 'CO₂ CON IMPUREZAS'
          : 'CO₂ PURO Y CERRADO'
        : 'EN ESPERA',
      ax,
      ay + 4
    );
    ctx.fillStyle = '#ffd166';
    ctx.font = '8.5px monospace';
    ctx.fillText('[Clic en Llaves para abrir/cerrar]', ax, benchY + 15);
  }

  function renderEqualizeAndM1Scene(ctx, w, h, tick) {
    const benchY = h - 62;
    const ax = 240, ay = benchY - 75;

    // Ampolla de Regnault desconectada lista para giro de 180°
    ctx.beginPath();
    ctx.arc(ax, ay, 42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 214, 160, 0.26)';
    ctx.fill();
    ctx.strokeStyle = state.errors.regnaultLeak || state.errors.leaveValveOpenTooLong180 ? '#ff9f1c' : '#f1faee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    window.LabCommon.drawStopcock(ctx, ax - 50, ay, false, 'Llave A (Cerrada)');
    window.LabCommon.drawStopcock(
      ctx,
      ax + 50,
      ay,
      state.errors.leaveValveOpenTooLong180 || state.pressureEqualized180,
      state.errors.leaveValveOpenTooLong180 ? '¡Abierta de más!' : 'Llave B (180°)'
    );

    if (state.errors.regnaultLeak) {
      ctx.fillStyle = '#ff5964';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💨 Microfuga en robinete (difunde aire)', ax, ay - 70);
    }

    // Indicador de presión interna dentro de la ampolla
    const pInternal = state.pressureEqualized180 && !state.errors.skipEqualize180
      ? state.patmTorr
      : state.patmTorr + state.errors.hclHeadCm * (1.09 / 13.5951) * 10.0;

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EQUILIBRADO CON P_atm (GIRO 180°)', ax, ay - 54);

    ctx.fillStyle = state.pressureEqualized180 && !state.errors.skipEqualize180 ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `P interna: ${pInternal.toFixed(1)} torr`,
      ax,
      ay + 4
    );
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '9.5px monospace';
    ctx.fillText(
      state.errors.leaveValveOpenTooLong180
        ? '⚠️ Llave abierta mucho tiempo: escapa CO₂ y entra aire'
        : state.pressureEqualized180 && !state.errors.skipEqualize180
        ? '★ Giro rápido 180° realizado: exceso liberado (P = P_atm)'
        : '⚠️ Sobrepresión del Kipp acumulada (Clic en Llave B para girar 180°)',
      ax,
      ay + 62
    );

    // Balanza analítica a la derecha para pesar m1
    const m1Str = state.m1Weighed && state.measured.m1_g !== null
      ? `${state.measured.m1_g.toFixed(4)} g`
      : '0.0000 g';
    window.LabCommon.drawAnalyticalBalance(
      ctx,
      565,
      benchY,
      m1Str,
      'PESADA CON CO₂ (m₁)',
      state.m1Weighed ? 'ampolla_co2' : 'none'
    );
  }

  function renderWaterAndM2Scene(ctx, w, h) {
    const benchY = h - 62;
    const ax = 240, ay = benchY - 75;

    // Trompa de vacío (trompa de agua) conectada arriba y vaso de agua hervida abajo
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 75, ay);
    ctx.lineTo(ax - 55, ay);
    ctx.stroke();
    ctx.fillStyle = '#a0aec0';
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Trompa Vacío', ax - 88, ay - 6);

    // Ampolla llenándose con agua destilada hervida y enfriada
    ctx.beginPath();
    ctx.arc(ax, ay, 42, 0, Math.PI * 2);
    ctx.fillStyle = state.waterFilled ? 'rgba(56, 189, 248, 0.65)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle =
      state.errors.airBubblesWaterMl > 0 || state.errors.wetExteriorM2 ? '#ff9f1c' : '#f1faee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Si hay burbujas de aire adheridas al llenar con agua, dibujarlas en las paredes de la ampolla
    if (state.waterFilled && state.errors.airBubblesWaterMl > 0) {
      const bubbleCoords = [
        [-24, -18, 4.5], [22, -16, 4.0], [-28, 8, 3.8],
        [26, 10, 4.2], [-10, -28, 3.5], [12, 24, 3.6], [0, -8, 3.2]
      ];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.2;
      bubbleCoords.forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(ax + dx, ay + dy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = '#ff5964';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ Burbujas de aire (${state.errors.airBubblesWaterMl.toFixed(1)} mL) → subestima V`, ax, ay - 46);
    }

    // Si no se secó el exterior de la ampolla antes de pesar m2
    if (state.errors.wetExteriorM2) {
      ctx.fillStyle = '#38bdf8';
      [[-45, -12], [45, -8], [-44, 15], [44, 18], [0, 46]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(ax + dx, ay + dy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#ff9f1c';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💧 Exterior sin secar (+4.8 g en m₂ → sobreestima V)', ax, ay - 68);
    }

    window.LabCommon.drawStopcock(ctx, ax - 50, ay, !state.waterFilled, 'Llave A');
    window.LabCommon.drawStopcock(ctx, ax + 50, ay, !state.waterFilled, 'Llave B');

    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CALIBRACIÓN DE VOLUMEN CON H₂O(l)', ax, ay - 56);

    const rhoW = window.LabCommon.getWaterDensity(state.tempAguaC);
    ctx.fillStyle = '#f8f9fa';
    ctx.font = '10.5px monospace';
    ctx.fillText(`T agua: ${state.tempAguaC.toFixed(1)} °C | δ(H₂O) = ${rhoW.toFixed(5)} g/mL`, ax, ay + 62);

    const m2Str = state.m2Weighed && state.measured.m2_g !== null
      ? `${state.measured.m2_g.toFixed(2)} g`
      : '0.00 g';
    window.LabCommon.drawAnalyticalBalance(
      ctx,
      565,
      benchY,
      m2Str,
      'PESADA CON AGUA (m₂)',
      state.m2Weighed ? 'ampolla_agua' : 'none'
    );
  }

  function renderCalculationsBoard(ctx, w, h) {
    const calc = state.calculated || performFinalCalculations();

    // Pizarrón izquierdo: Pesadas y Volumen
    window.LabCommon.drawPixelBox(ctx, 24, 50, 345, 195, '#151c2c', '#7bdff2', 2);
    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1. DATOS GRAVIMÉTRICOS Y VOLUMEN:', 38, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`m₀ (ampolla vacía):    ${state.measured.m0_g.toFixed(4)} g`, 38, 95);
    ctx.fillText(`m₁ (ampolla + CO₂):    ${state.measured.m1_g.toFixed(4)} g`, 38, 114);
    ctx.fillText(`m₂ (ampolla + H₂O):    ${state.measured.m2_g.toFixed(2)} g`, 38, 133);
    ctx.fillText(`δ agua (${state.tempAguaC.toFixed(1)} °C):      ${calc.rhoAgua.toFixed(5)} g/mL`, 38, 154);

    ctx.fillStyle = state.calcSolved.m_agua ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `Masa H₂O (m₂ - m₀):    ${state.calcSolved.m_agua ? calc.mAguaAparenteG.toFixed(2) + ' g' : '[ ? Calcular abajo ]'}`,
      38,
      176
    );
    ctx.fillStyle = state.calcSolved.v_ampolla ? '#06d6a0' : '#ff9f1c';
    ctx.fillText(
      `Volumen ampolla (V):   ${state.calcSolved.v_ampolla ? calc.vAmpollaMl.toFixed(2) + ' mL' : '[ ? Calcular abajo ]'}`,
      38,
      195
    );
    ctx.fillStyle = state.calcSolved.m_co2 ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `Masa CO₂ (m₁ - m₀):    ${state.calcSolved.m_co2 ? calc.mGasAparenteG.toFixed(4) + ' g' : '[ ? Calcular abajo ]'}`,
      38,
      218
    );

    // Pizarrón derecho: Densidades y Comparación CNTP
    window.LabCommon.drawPixelBox(ctx, 385, 50, 351, 195, '#151c2c', '#ffd166', 2);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('2. DENSIDAD DEL CO₂ Y REDUCCIÓN A CNTP:', 399, 72);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`Condiciones exp: ${state.tempAmbC.toFixed(1)} °C y ${state.patmTorr.toFixed(1)} torr`, 399, 95);

    ctx.fillStyle = state.calcSolved.delta_exp ? '#06d6a0' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `δ_exp (T, P):          ${state.calcSolved.delta_exp ? calc.deltaExpGL.toFixed(4) + ' g/L' : '[ ? Calcular abajo ]'}`,
      399,
      118
    );
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '11px monospace';
    ctx.fillText(`δ_ideal (T, P):        ${calc.deltaTeoAmbGL.toFixed(4)} g/L`, 399, 138);

    ctx.fillStyle = state.calcSolved.delta_cntp ? '#7bdff2' : '#ff9f1c';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `δ_exp corregida CNTP:  ${state.calcSolved.delta_cntp ? calc.deltaCntpExpGL.toFixed(4) + ' g/L' : '[ ? Calcular abajo ]'}`,
      399,
      164
    );
    ctx.fillStyle = '#f8f9fa';
    ctx.font = '11px monospace';
    ctx.fillText(`δ_tabulada CNTP ideal: ${calc.deltaIdealCntpGL.toFixed(4)} g/L`, 399, 184);

    const errAbs = Math.abs(calc.relErrorPercent);
    ctx.fillStyle = !state.calcSolved.err_rel
      ? '#ff9f1c'
      : errAbs < 1.5
      ? '#06d6a0'
      : errAbs < 5.0
      ? '#ff9f1c'
      : '#ff5964';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      `Error relativo CNTP:   ${
        state.calcSolved.err_rel
          ? (calc.relErrorPercent >= 0 ? '+' : '') + calc.relErrorPercent.toFixed(2) + ' %'
          : '[ ? Calcular abajo ]'
      }`,
      399,
      212
    );

    // Diagnóstico de errores experimentales de parcial (Abajo en la pizarra)
    const activeErrs = [];
    if (state.errors.regnaultLeak) activeErrs.push('Pérdida en robinete Regnault (+m₀ aire → DEFECTO)');
    if (state.errors.turnOffPumpBeforeCloseValve) activeErrs.push('Apagó bomba antes de cerrar Llave A (+m₀ → DEFECTO)');
    if (state.errors.skipTrainPurge) activeErrs.push('No purgó aire del tren (-m₁ → DEFECTO)');
    if (state.errors.wrongValveCloseOrder) activeErrs.push('Cerró Kipp antes que salida atm (-m₁ → DEFECTO)');
    if (state.errors.skipEqualize180) activeErrs.push('No equilibró 180° (+P Kipp → EXCESO)');
    if (state.errors.leaveValveOpenTooLong180) activeErrs.push('Llave 180° abierta de más (-m₁ → DEFECTO)');
    if (state.errors.residualPressureCmHg > 0) activeErrs.push(`Vacío incompleto (${(state.errors.residualPressureCmHg * 10).toFixed(0)} torr → DEFECTO)`);
    if (state.errors.missingH2SO4Flask || state.errors.missingSilicaFlask) activeErrs.push('Pasó vapor H₂O (PM 18 < 44 → DEFECTO)');
    if (state.errors.missingWaterFlask) activeErrs.push('Sin frasco H₂O (Pasa HCl PM 36.5 → DEFECTO)');
    if (state.errors.so3ImpurityInKipp) activeErrs.push('Impureza SO₃ en Kipp (PM 80 > 44 → EXCESO)');
    if (state.errors.airBubblesWaterMl > 0) activeErrs.push(`Burbujas en agua m₂ (-V → EXCESO)`);
    if (state.errors.wetExteriorM2) activeErrs.push('Exterior sin secar en m₂ (+V → DEFECTO)');

    window.LabCommon.drawPixelBox(
      ctx,
      24,
      250,
      712,
      36,
      '#101827',
      activeErrs.length > 0 ? '#ff5964' : '#06d6a0',
      1.5
    );
    ctx.font = 'bold 10.5px monospace';
    ctx.textAlign = 'left';
    if (activeErrs.length === 0) {
      ctx.fillStyle = '#06d6a0';
      ctx.fillText('✓ CONDICIÓN EXPERIMENTAL: Sin errores sistemáticos activos (Usá los botones de abajo para simular errores de parcial)', 36, 272);
    } else {
      const biasType = calc.relErrorPercent > 0.3 ? 'ERROR POR EXCESO (+)' : calc.relErrorPercent < -0.3 ? 'ERROR POR DEFECTO (-)' : 'COMPENSADO';
      ctx.fillStyle = '#ff5964';
      ctx.fillText(`⚠️ ${biasType}: ${activeErrs.join(' | ')}`, 36, 272);
    }
  }

  return {
    getState: function () {
      return state;
    },

    reset: function () {
      state = createInitialState();
    },

    computeM0: computeM0,
    computeM1: computeM1,
    computeM2: computeM2,
    performFinalCalculations: performFinalCalculations,
    renderScene: renderScene,

    getHudInfo: function () {
      const m0Txt = state.m0Weighed && state.measured.m0_g ? `${state.measured.m0_g.toFixed(3)}g` : '---';
      const m1Txt = state.m1Weighed && state.measured.m1_g ? `${state.measured.m1_g.toFixed(3)}g` : '---';
      const dTxt = state.calculated ? `${state.calculated.deltaCntpExpGL.toFixed(3)} g/L` : 'Pendiente';
      return [
        { label: 'TP Actual:', value: '2. Densidad de Gases (CO₂)' },
        { label: 'T / P_atm:', value: `${state.tempAmbC.toFixed(1)}°C / ${state.patmTorr.toFixed(0)} torr` },
        { label: 'm₀ / m₁:', value: `${m0Txt} / ${m1Txt}` },
        { label: 'δ(CNTP):', value: dTxt },
        { label: 'Puntaje:', value: `${state.score} pts` }
      ];
    },

    getLogbookData: function () {
      const calc = state.calculated;
      const headers = ['Magnitud Experimental', 'Símbolo / Fórmula', 'Valor Medido / Calculado', 'Unidad'];
      const rows = [
        ['Temperatura ambiente', 'T_amb', state.tempAmbC.toFixed(1), '°C'],
        ['Presión atmosférica', 'P_atm', state.patmTorr.toFixed(1), 'torr (mmHg)'],
        ['Temperatura del agua destilada', 'T_agua', state.tempAguaC.toFixed(1), '°C'],
        ['Densidad del agua a T_agua', 'δ_H2O', window.LabCommon.getWaterDensity(state.tempAguaC).toFixed(5), 'g/mL'],
        ['Masa ampolla evacuada', 'm₀', state.m0Weighed && state.measured.m0_g ? state.measured.m0_g.toFixed(4) : 'Pendiente', 'g'],
        ['Masa ampolla llena de CO₂', 'm₁', state.m1Weighed && state.measured.m1_g ? state.measured.m1_g.toFixed(4) : 'Pendiente', 'g'],
        ['Masa ampolla llena de H₂O', 'm₂', state.m2Weighed && state.measured.m2_g ? state.measured.m2_g.toFixed(2) : 'Pendiente', 'g']
      ];

      if (calc) {
        rows.push(
          ['Masa de agua (m₂ - m₀)', 'm_H2O', calc.mAguaAparenteG.toFixed(2), 'g'],
          ['Volumen de la ampolla', 'V = m_H2O / δ_H2O', calc.vAmpollaMl.toFixed(2), 'mL'],
          ['Masa de gas CO₂ (m₁ - m₀)', 'm_CO2', calc.mGasAparenteG.toFixed(4), 'g'],
          ['Densidad experimental (T, P)', 'δ_exp = m_CO2 / V', calc.deltaExpGL.toFixed(4), 'g/L'],
          ['Densidad corregida a CNTP', 'δ_CNTP', calc.deltaCntpExpGL.toFixed(4), 'g/L'],
          ['Densidad teórica ideal CNTP', 'PM / 22.414', calc.deltaIdealCntpGL.toFixed(4), 'g/L'],
          ['Error relativo porcentual', 'Er %', `${calc.relErrorPercent.toFixed(2)}`, '%']
        );
      }

      return {
        title: 'Densidad de Gases — Determinación de la Densidad del CO₂',
        metaHtml: `<strong>Generador:</strong> Aparato de Kipp (CaCO₃ + 2HCl) &nbsp;|&nbsp; <strong>Tren Purificador:</strong> Frasco 1 (H₂O) · Frasco 2 (H₂SO₄) · Frasco 3 (Sílica Gel) &nbsp;|&nbsp; <strong>Ampolla de Regnault:</strong> ~500 mL`,
        headers: headers,
        rows: rows,
        metaLines: [
          `Temperatura de trabajo: ${state.tempAmbC.toFixed(1)} °C`,
          `Presión atmosférica: ${state.patmTorr.toFixed(1)} torr`,
          `Equilibrado por giro de 180° de llave: ${state.pressureEqualized180 && !state.errors.skipEqualize180 ? 'Realizado' : 'Omitido'}`
        ],
        conclusionLines: calc
          ? [
              `Volumen calibrado de la ampolla de Regnault: ${calc.vAmpollaMl.toFixed(2)} mL`,
              `Densidad experimental a T y P ambiente: ${calc.deltaExpGL.toFixed(4)} g/L`,
              `Densidad experimental proyectada a CNTP: ${calc.deltaCntpExpGL.toFixed(4)} g/L (Ideal: ${calc.deltaIdealCntpGL.toFixed(4)} g/L)`,
              `Error relativo porcentual: ${calc.relErrorPercent.toFixed(2)} %`
            ]
          : ['Cálculos finales pendientes de completar las 3 pesadas (m0, m1, m2).']
      };
    }
  };
})();
