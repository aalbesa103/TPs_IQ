/**
 * tests/autotest.js
 * Suite automatizada de pruebas integrales para los 4 Trabajos Prácticos de
 * Introducción a la Química (UNLP).
 *
 * Uso por consola:
 *   node tests/autotest.js
 */

const assert = require('assert');
const path = require('path');

// 1. Mock de entorno navegador / Canvas para ejecución en Node.js
global.window = global;
global.window.addEventListener = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };

const fakeCtx = new Proxy(
  {},
  {
    get: (t, prop) => {
      if (prop === 'measureText') return () => ({ width: 42 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => {} });
      }
      return () => {};
    },
    set: () => true
  }
);

const fakeCanvas = {
  width: 760,
  height: 300,
  getContext: () => fakeCtx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 760, height: 300 }),
  addEventListener: () => {}
};

const domElements = {};
function makeEl(id) {
  return {
    id,
    className: '',
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    checked: false,
    style: {},
    children: [],
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => true
    },
    addEventListener: function (ev, fn) {
      this['_on_' + ev] = fn;
    },
    appendChild: function (child) {
      this.children.push(child);
    },
    querySelector: () => makeEl('sub'),
    querySelectorAll: () => [],
    getContext: () => fakeCtx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 760, height: 300 }),
    scrollIntoView: () => {},
    focus: () => {}
  };
}

let onReady = null;
global.document = {
  activeElement: null,
  getElementById: id => {
    if (!domElements[id]) domElements[id] = makeEl(id);
    return domElements[id];
  },
  querySelector: () => makeEl('qs'),
  querySelectorAll: () => [],
  createElement: tag => makeEl(tag),
  addEventListener: (ev, fn) => {
    if (ev === 'DOMContentLoaded') onReady = fn;
  }
};
global.requestAnimationFrame = () => {};

// 2. Carga de todos los módulos de la aplicación
const root = path.resolve(__dirname, '..');
require(path.join(root, 'js/audio.js'));
require(path.join(root, 'js/common.js'));
require(path.join(root, 'js/exporter.js'));
require(path.join(root, 'js/tp1_gases.js'));
require(path.join(root, 'js/tp2_densidad.js'));
require(path.join(root, 'js/tp3_victor_meyer.js'));
require(path.join(root, 'js/tp4_calorimetria.js'));
require(path.join(root, 'js/main.js'));

if (onReady) onReady();

let passed = 0;
function check(name, condition, detail = '') {
  assert(condition, `FALLÓ: ${name} (${detail})`);
  passed++;
  console.log(`  [OK] ${name}${detail ? ' -> ' + detail : ''}`);
}

console.log('================================================================');
console.log(' AUTOTEST INTEGRAL — SUITE RPG INTRODUCCIÓN A LA QUÍMICA (UNLP)');
console.log('================================================================\n');

console.log('1. Motor Matemático, Evaluador Científico y Diagnóstico de Unidades:');
check(
  'Calculadora científica (safeEvalMath)',
  Math.abs(window.LabCommon.safeEvalMath('(758 - 19.8) / 760') - 0.971315) < 0.0005,
  '(758 - 19.8)/760 = 0.9713'
);
check(
  'Soporte de coma decimal y expresiones en respuestas',
  window.LabCommon.diagnoseNumericAnswer('0,9974', 758 / 760, 0.005, 0.002).ok,
  '0,9974 atm reconocido como correcto'
);
check(
  'Detección de error de signo (ej. ΔH exotérmico)',
  window.LabCommon.diagnoseNumericAnswer('13.7', -13.7, 0.02, 0.05).msg.includes('signo'),
  'Alerta de signo invertido activa'
);
check(
  'Detección de error de unidades ×1000 (mL vs L / cal vs kcal)',
  window.LabCommon.diagnoseNumericAnswer('1963.5', 1.9635, 0.02, 0.05).msg.includes('1000'),
  'Alerta de factor 1000 activa'
);

console.log('\n2. TP 1: Comportamiento y Leyes de los Gases:');
window.LabApp.startTP1();
const st1 = window.TP1_Gases.getState();
const eq1 = window.TP1_Gases.computeBoyleEquilibrium(st1);
check('Ley de Boyle-Mariotte (P·V = cte)', eq1.PV > 10 && eq1.PV < 25, `P·V = ${eq1.PV.toFixed(2)} atm·mL`);
const glRows = window.TP1_Gases.generateIdealGayLussacSample();
const reg = window.LabCommon.linearRegression(glRows.map(r => ({ x: r.t_C, y: r.P_atm })));
const tZero = -reg.intercept / reg.slope;
check('Extrapolación del Cero Absoluto (Gay-Lussac)', Math.abs(tZero - -273.15) < 1.5, `t0 = ${tZero.toFixed(2)} °C`);
const rGrahamExp = st1.dNH3_cm / st1.dHCl_cm;
const rGrahamTeo = Math.sqrt(36.461 / 17.031);
check('Ley de Difusión de Graham (NH₃/HCl)', Math.abs(rGrahamExp - rGrahamTeo) < 0.03, `r_exp = ${rGrahamExp.toFixed(3)} vs r_teo = ${rGrahamTeo.toFixed(3)}`);
['fortin', 'boyle', 'boyle_graphs', 'gay_lussac', 'gl_graph', 'graham', 'quiz'].forEach(stage => {
  st1.stage = stage;
  window.TP1_Gases.renderScene(fakeCanvas);
});
check('Renderizado Canvas de las 7 escenas de TP 1', true);

console.log('\n3. TP 2: Densidad de Gases (CO₂ - Kipp y Ampolla de Regnault):');
window.LabApp.startTP2();
const st2 = window.TP2_Densidad.getState();
st2.vacuumDone = true;
window.TP2_Densidad.computeM0();
st2.pressureEqualized180 = true;
window.TP2_Densidad.computeM1();
window.TP2_Densidad.computeM2();
const calc2 = window.TP2_Densidad.performFinalCalculations();
check('Densidad en CNTP sin errores sistemáticos', Math.abs(calc2.deltaCntpExpGL - 1.9635) < 0.01, `δ_CNTP = ${calc2.deltaCntpExpGL.toFixed(4)} g/L`);
st2.errors.skipEqualize180 = true;
window.TP2_Densidad.computeM1();
const calc2OverP = window.TP2_Densidad.performFinalCalculations();
check('Simulación de error por omitir giro de 180° (sobrepresión Kipp)', calc2OverP.deltaCntpExpGL > calc2.deltaCntpExpGL, `δ_aparente sube a ${calc2OverP.deltaCntpExpGL.toFixed(4)} g/L`);
['vacio', 'pesar_m0', 'kipp_tren', 'equilibrar_m1', 'agua_m2', 'calculos', 'quiz'].forEach(stage => {
  st2.stage = stage;
  window.TP2_Densidad.renderScene(fakeCanvas);
});
check('Renderizado Canvas de las 7 escenas de TP 2', true);

console.log('\n4. TP 3: Determinación de Pesos Moleculares (Víctor Meyer):');
window.LabApp.startTP3();
const st3 = window.TP3_VictorMeyer.getState();
Object.keys(window.TP3_VictorMeyer.SUBSTANCES).forEach(subKey => {
  const sub = window.TP3_VictorMeyer.SUBSTANCES[subKey];
  st3.substanceKey = subKey;
  st3.sampleMassG = sub.defaultMassG;
  st3.errors.skipPurge = false;
  st3.errors.slowStopperLoss = false;
  window.TP3_VictorMeyer.computeCollectedVolume();
  const c3 = window.TP3_VictorMeyer.performCalculations();
  check(
    `Muestra ${sub.name} (${sub.formula}) con masa óptima`,
    !st3.bellOverflowed && Math.abs(c3.mwExp - sub.mw) < 0.5,
    `V = ${st3.collectedVolMl.toFixed(1)} mL, PM_exp = ${c3.mwExp.toFixed(2)} g/mol`
  );
});
st3.substanceKey = 'chloroform';
st3.sampleMassG = 0.300;
window.TP3_VictorMeyer.computeCollectedVolume();
const c3Over = window.TP3_VictorMeyer.performCalculations();
check(
  'Desborde de campana (> 50 mL) al pesar muestra de más (300 mg)',
  st3.bellOverflowed && st3.collectedVolMl === 50.0 && c3Over.mwExp > 140,
  `V_real = ${st3.unclampedVolMl.toFixed(1)} mL -> retiene 50.0 mL -> PM se infla a ${c3Over.mwExp.toFixed(1)} g/mol`
);
['preparacion', 'pesada', 'vaporizacion', 'lectura', 'calculos', 'quiz'].forEach(stage => {
  st3.stage = stage;
  window.TP3_VictorMeyer.renderScene(fakeCanvas);
});
check('Renderizado Canvas (incluyendo Lupa de Campana y Desborde) de TP 3', true);

console.log('\n5. TP 4: Calorimetría — Calor de Neutralización:');
window.LabApp.startTP4();
const st4 = window.TP4_Calorimetria.getState();
window.TP4_Calorimetria.computeEquivExperiment();
check('Calibración del Equivalente en Agua del calorímetro (E)', Math.abs(st4.calcWaterEquivE - st4.realWaterEquivE) < 0.2, `E = ${st4.calcWaterEquivE.toFixed(2)} cal/°C`);
st4.acidType = 'HCl';
window.TP4_Calorimetria.generateNeutralizationCurve();
const c4Strong = window.TP4_Calorimetria.performFinalCalculations();
check('Entalpía de neutralización Ácido Fuerte (HCl + NaOH)', Math.abs(c4Strong.dH_exp_kcal_eq - -13.7) < 0.15, `ΔH = ${c4Strong.dH_exp_kcal_eq.toFixed(2)} kcal/eq`);
st4.acidType = 'CH3COOH';
window.TP4_Calorimetria.generateNeutralizationCurve();
const c4Weak = window.TP4_Calorimetria.performFinalCalculations();
check('Menor calor liberado en Ácido Débil (CH₃COOH + NaOH)', Math.abs(c4Weak.dH_exp_kcal_eq) < Math.abs(c4Strong.dH_exp_kcal_eq), `ΔH = ${c4Weak.dH_exp_kcal_eq.toFixed(2)} kcal/eq`);
['equivalente_agua', 'neutralizacion', 'marcha_grafica', 'dilucion', 'calculos', 'quiz'].forEach(stage => {
  st4.stage = stage;
  window.TP4_Calorimetria.renderScene(fakeCanvas);
});
check('Renderizado Canvas de las 6 escenas de TP 4', true);

console.log(`\n================================================================`);
console.log(` RESULTADO FINAL: ${passed} PRUEBAS SUPERADAS SIN ERRORES (100% OK)`);
console.log(`================================================================`);
process.exit(0);
