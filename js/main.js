/**
 * main.js
 * Controlador principal de la Suite RPG de Introducción a la Química (UNLP).
 * Incluye:
 * - Hub de Recepción del JTP (selección entre los 4 Trabajos Prácticos)
 * - Manipulación interactiva directa de válvulas, mecheros, peras de goma y tornillos (en Canvas y controles)
 * - Mesa de Cálculos del Estudiante con calculadora científica integrada y verificación diagnóstica
 * - Modo Alumno / Modo Docente en tiempo real
 * - Bitácora experimental y exportación de informes (.TXT y .CSV)
 */

window.LabApp = (function () {
  const app = {
    activeTp: 'hub', // 'hub' | 'tp1' | 'tp2' | 'tp3' | 'tp4'
    teacherMode: false,
    speaker: 'jtp',
    fullText: '',
    displayedText: '',
    typewriterId: null,
    grahamAnimId: null
  };

  let dom = {};

  function cacheDom() {
    dom = {
      hudStats: document.getElementById('hud-stats'),
      btnHub: document.getElementById('btn-hub'),
      btnChallenges: document.getElementById('btn-challenges'),
      btnMode: document.getElementById('btn-mode'),
      btnLogbook: document.getElementById('btn-logbook'),
      btnMute: document.getElementById('btn-mute'),
      teacherPanel: document.getElementById('teacher-panel'),
      teacherContent: document.getElementById('teacher-content'),
      sceneCanvas: document.getElementById('scene-canvas'),
      instrumentBar: document.getElementById('instrument-bar'),
      calcWorkbench: document.getElementById('calc-workbench'),
      portraitCanvas: document.getElementById('portrait-canvas'),
      speakerName: document.getElementById('speaker-name'),
      speakerRole: document.getElementById('speaker-role'),
      dialogText: document.getElementById('dialog-text'),
      optionsContainer: document.getElementById('options-container'),
      logbookPanel: document.getElementById('logbook-panel'),
      logbookTitle: document.getElementById('logbook-title'),
      logbookSummary: document.getElementById('logbook-summary'),
      logbookHead: document.getElementById('logbook-thead'),
      logbookBody: document.getElementById('logbook-tbody'),
      btnExportTxt: document.getElementById('btn-export-txt'),
      btnExportCsv: document.getElementById('btn-export-csv'),
      btnCloseLog: document.getElementById('btn-close-log')
    };
  }

  /**
   * Normaliza un texto ignorando variaciones numéricas de sliders para detectar
   * si el personaje sigue diciendo la misma frase base.
   */
  function normalizeSpeechTemplate(str) {
    return String(str || '').replace(/[0-9]+([.,][0-9]+)?/g, '#');
  }

  /**
   * Muestra un diálogo con efecto máquina de escribir y tono cordial universitario.
   * Si el hablante y la plantilla del texto son idénticos al actual, actualiza las cifras
   * en silencio sin reiniciar la animación de voz para evitar bucles al mover sliders.
   */
  function showDialog(speakerKey, text, options, workbenchCfg = null) {
    const isSameSpeech =
      app.speaker === speakerKey &&
      normalizeSpeechTemplate(app.fullText) === normalizeSpeechTemplate(text);

    if (isSameSpeech) {
      app.fullText = text;
      if (!app.typewriterId) {
        app.displayedText = text;
        dom.dialogText.textContent = text;
      }
    } else {
      if (app.typewriterId) {
        clearInterval(app.typewriterId);
        app.typewriterId = null;
      }

      const charInfo = window.LabCommon.CHARACTERS[speakerKey] || window.LabCommon.CHARACTERS.jtp;
      app.speaker = speakerKey;
      app.fullText = text;
      app.displayedText = '';

      dom.speakerName.textContent = charInfo.name;
      dom.speakerName.style.color = charInfo.color;
      dom.speakerRole.textContent = charInfo.role;
      dom.dialogText.textContent = '';

      window.LabCommon.drawPortrait(dom.portraitCanvas, speakerKey);

      let idx = 0;
      app.typewriterId = setInterval(() => {
        if (idx < app.fullText.length) {
          const chunk = app.fullText.slice(idx, idx + 2);
          app.displayedText += chunk;
          dom.dialogText.textContent = app.displayedText;
          if (idx % 6 === 0) {
            window.AudioEngine.playTextBlip(speakerKey);
          }
          idx += 2;
        } else {
          clearInterval(app.typewriterId);
          app.typewriterId = null;
          dom.dialogText.textContent = app.fullText;
        }
      }, 15);
    }

    renderOptions(options || []);
    updateHud();
    renderInstrumentBar();
    window.LabCommon.renderCalcWorkbench(dom.calcWorkbench, workbenchCfg);
    renderTeacherPanel();
  }

  function completeTypewriter() {
    if (app.typewriterId) {
      clearInterval(app.typewriterId);
      app.typewriterId = null;
      dom.dialogText.textContent = app.fullText;
    }
  }

  function renderOptions(options) {
    dom.optionsContainer.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'rpg-btn ' + (opt.styleClass || '');
      btn.textContent = opt.label;
      if (opt.disabled) btn.disabled = true;
      btn.addEventListener('click', () => {
        window.AudioEngine.playSelect();
        if (typeof opt.onClick === 'function') {
          opt.onClick();
        }
      });
      dom.optionsContainer.appendChild(btn);
    });
  }

  function updateHud() {
    let items = [];
    if (app.activeTp === 'hub') {
      items = [
        { label: 'Cátedra:', value: 'Introducción a la Química (UNLP)' },
        { label: 'Estado:', value: 'Recepción de Laboratorio' },
        { label: 'TPs Disponibles:', value: '4 Trabajos Prácticos' },
        { label: 'Seguridad:', value: 'Guardapolvo y Gafas OK' }
      ];
    } else if (app.activeTp === 'tp1') {
      items = window.TP1_Gases.getHudInfo();
    } else if (app.activeTp === 'tp2') {
      items = window.TP2_Densidad.getHudInfo();
    } else if (app.activeTp === 'tp3') {
      items = window.TP3_VictorMeyer.getHudInfo();
    } else if (app.activeTp === 'tp4') {
      items = window.TP4_Calorimetria.getHudInfo();
    }

    dom.hudStats.innerHTML = items
      .map(
        it =>
          `<div class="hud-stat-item"><span class="hud-label">${it.label}</span><span class="hud-value">${it.value}</span></div>`
      )
      .join('');

    dom.btnMode.textContent = app.teacherMode ? '👨‍🏫 Modo Docente: ON' : '🎓 Modo Alumno';
    dom.btnMode.className = 'hud-btn ' + (app.teacherMode ? 'mode-teacher' : 'mode-student');
  }

  // =========================================================================
  // ESCENA CENTRAL: RECEPCIÓN DEL LABORATORIO (HUB DEL JTP)
  // =========================================================================
  function enterHub() {
    app.activeTp = 'hub';
    if (app.grahamAnimId) {
      clearInterval(app.grahamAnimId);
      app.grahamAnimId = null;
    }

    showDialog(
      'jtp',
      '«¡Hola! Te damos la bienvenida al laboratorio de la Cátedra de Introducción a la Química. Antes de acercarte a las mesadas, verificá tener el guardapolvo abrochado y las gafas de seguridad colocadas. En cada Trabajo Práctico vas a operar el instrumental, tomar las lecturas y realizar vos mismo los cálculos en tu mesa de trabajo. ¿Por cuál querés empezar?»',
      [
        {
          label: '1️⃣ TP 1: Comportamiento y Leyes de los Gases (Boyle, Gay-Lussac, Graham y Fortín)',
          styleClass: 'rpg-btn-hub',
          onClick: () => startTP1()
        },
        {
          label: '2️⃣ TP 2: Densidad de Gases (Aparato de Kipp, Tren Purificador y Regnault)',
          styleClass: 'rpg-btn-hub',
          onClick: () => startTP2()
        },
        {
          label: '3️⃣ TP 3: Determinación de Pesos Moleculares (Método de Víctor Meyer)',
          styleClass: 'rpg-btn-hub',
          onClick: () => startTP3()
        },
        {
          label: '4️⃣ TP 4: Calorimetría — Calor de Neutralización y Termómetro de Beckmann',
          styleClass: 'rpg-btn-hub',
          onClick: () => startTP4()
        },
        {
          label: '📝 Entrenador de Ejercicios de Parcial y Cuestiones Experimentales (Compilado de 18 Parciales + Guía)',
          styleClass: 'rpg-btn-accent',
          onClick: () => openChallengesMenu()
        },
        {
          label: '📋 Repasar normas de seguridad y uso de la calculadora de laboratorio',
          onClick: () => {
            showDialog(
              'ayudante',
              '«Recordá las pautas de nuestra Guía de TP: trabajá siempre con guardapolvo de manga larga prendido y gafas de seguridad. En cada etapa verás la "Mesa de Cálculos del Estudiante" con una calculadora científica integrada: ingresá tus resultados respetando las unidades pedidas para verificar tu procedimiento y desbloquear los datos de la pizarra.»',
              [
                {
                  label: '↩ Volver a la selección de Trabajos Prácticos',
                  styleClass: 'rpg-btn-accent',
                  onClick: () => enterHub()
                }
              ]
            );
          }
        }
      ],
      null
    );
  }

  function renderHubScene(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const tick = window.LabCommon.nextTick();

    window.LabCommon.drawLabBackground(
      ctx,
      w,
      h,
      'FACULTAD DE CIENCIAS EXACTAS (UNLP) — CÁTEDRA DE INTRODUCCIÓN A LA QUÍMICA'
    );

    const cards = [
      {
        x: 24,
        y: 52,
        w: 168,
        h: 168,
        num: 'TP 1',
        title: 'LEYES DE GASES',
        sub1: '• Barómetro Fortín',
        sub2: '• Boyle y Gay-Lussac',
        sub3: '• Difusión Graham',
        color: '#7bdff2'
      },
      {
        x: 206,
        y: 52,
        w: 168,
        h: 168,
        num: 'TP 2',
        title: 'DENSIDAD GASES',
        sub1: '• Aparato de Kipp',
        sub2: '• Tren Desecador',
        sub3: '• Ampolla Regnault',
        color: '#06d6a0'
      },
      {
        x: 388,
        y: 52,
        w: 168,
        h: 168,
        num: 'TP 3',
        title: 'VÍCTOR MEYER',
        sub1: '• Líquidos Volátiles',
        sub2: '• Camisa de Vapor',
        sub3: '• Peso Molecular',
        color: '#ffd166'
      },
      {
        x: 570,
        y: 52,
        w: 168,
        h: 168,
        num: 'TP 4',
        title: 'CALORIMETRÍA',
        sub1: '• Termo Adiabático',
        sub2: '• Equiv. en Agua E',
        sub3: '• ΔH Neutralización',
        color: '#ff9f1c'
      }
    ];

    cards.forEach((c, i) => {
      const pulse = Math.sin(tick * 0.06 + i) * 1.5;
      window.LabCommon.drawPixelBox(ctx, c.x, c.y + pulse, c.w, c.h, '#161e31', c.color, 2);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${c.num}: ${c.title}`, c.x + c.w / 2, c.y + 24 + pulse);

      const icX = c.x + c.w / 2;
      const icY = c.y + 72 + pulse;
      ctx.save();
      if (i === 0) {
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(icX - 16, icY - 22);
        ctx.lineTo(icX - 16, icY + 12);
        ctx.lineTo(icX + 16, icY + 12);
        ctx.lineTo(icX + 16, icY - 14);
        ctx.stroke();
      } else if (i === 1) {
        ctx.beginPath();
        ctx.arc(icX, icY - 4, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 214, 160, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#f1faee';
        ctx.lineWidth = 2;
        ctx.stroke();
        window.LabCommon.drawStopcock(ctx, icX - 24, icY - 4, true);
        window.LabCommon.drawStopcock(ctx, icX + 24, icY - 4, true);
      } else if (i === 2) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.strokeRect(icX - 18, icY - 24, 14, 38);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(icX + 6, icY - 16, 16, 30);
      } else {
        window.LabCommon.drawPixelBox(ctx, icX - 18, icY - 18, 36, 36, '#263238', '#f1faee', 1.5);
        ctx.fillStyle = '#ff5964';
        ctx.fillRect(icX - 2, icY - 28, 4, 38);
      }
      ctx.restore();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(c.sub1, c.x + 12, c.y + 115 + pulse);
      ctx.fillText(c.sub2, c.x + 12, c.y + 132 + pulse);
      ctx.fillText(c.sub3, c.x + 12, c.y + 149 + pulse);
    });

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      '▸ Hacé clic sobre una estación en el escenario o elegí el botón debajo para comenzar ◂',
      w / 2,
      h - 24
    );
  }

  // =========================================================================
  // FLUJO INTERACTIVO Y CÁLCULOS DEL TP 1: COMPORTAMIENTO Y LEYES DE LOS GASES
  // =========================================================================
  function startTP1() {
    app.activeTp = 'tp1';
    window.TP1_Gases.reset();
    runTP1Stage('fortin');
  }

  function runTP1Stage(stageName) {
    const st = window.TP1_Gases.getState();
    st.stage = stageName;

    if (stageName === 'fortin') {
      const aligned = Math.abs(st.fortinScrewOffsetMm) <= 0.25;
      const wbFortin = {
        title: 'CÁLCULO BAROMÉTRICO PRELIMINAR (Conversión de Unidades)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `<span><strong>Lectura en Barómetro (enrasado):</strong> ${st.patmMmHg.toFixed(1)} mmHg</span><span><strong>Equivalencia:</strong> 1 atm = 760 mmHg = 1013,25 hPa</span>`,
        fields: [
          {
            id: 'fortin_patm_atm',
            label: '1. Presión atmosférica en atmósferas (P_atm)',
            formulaHint: 'P(atm) = P(mmHg) / 760',
            unit: 'atm',
            targetValue: st.patmMmHg / 760.0,
            decimals: 4,
            relTol: 0.005,
            absTol: 0.002
          }
        ],
        onFieldSolved: () => {
          st.score += 10;
          updateHud();
        },
        onAllSolved: () => runTP1Stage('fortin')
      };

      let fortinMsg =
        '«Comencemos con el Barómetro de Fortín. Primero ajustá el tornillo inferior de la cubeta (con el deslizador o el botón de abajo) hasta que el mercurio toque la punta de marfil (desnivel = 0,0 mm).»';
      if (aligned && !st.calcSolved.fortin_patm_atm) {
        fortinMsg = `«¡Muy bien, el mercurio ya quedó enrasado en la punta de marfil (${st.patmMmHg.toFixed(1)} mmHg)! Ahora completá el cálculo de P_atm en la Mesa de Cálculos de arriba (dividiendo ${st.patmMmHg.toFixed(1)} / 760) y presioná "Verificar" (o "⚡ Resolver y Explicar Cálculos").»`;
      } else if (aligned && st.calcSolved.fortin_patm_atm) {
        fortinMsg = `«¡Excelente! Con el mercurio enrasado y P_atm convertida a atmósferas (${(st.patmMmHg / 760).toFixed(4)} atm), hacé clic en el botón verde de abajo para pasar a la Experiencia 1 (Ley de Boyle-Mariotte).»`;
      }

      showDialog(
        'jtp',
        fortinMsg,
        [
          {
            label: aligned
              ? '✓ 1° Mercurio enrasado en la punta de marfil (0.0 mm)'
              : '🔧 1° Enrasar mercurio en la punta de marfil (0.0 mm)',
            disabled: aligned,
            onClick: () => {
              st.fortinScrewOffsetMm = 0.0;
              window.AudioEngine.playDialTick(true);
              runTP1Stage('fortin');
            }
          },
          {
            label: st.calcSolved.fortin_patm_atm
              ? '✓ 2° Confirmar P_atm y pasar a la Experiencia 1 (Ley de Boyle-Mariotte)'
              : '🧮 2° Ir a verificar P_atm en la Mesa de Cálculos para pasar a Boyle-Mariotte',
            styleClass: 'rpg-btn-accent',
            disabled: !aligned,
            onClick: () => {
              if (!st.calcSolved.fortin_patm_atm) {
                const inp = document.getElementById('calc-in-fortin_patm_atm');
                const fb = document.getElementById('calc-fb-fortin_patm_atm');
                if (fb) {
                  fb.className = 'calc-feedback err';
                  fb.textContent = `👉 Ingresá ${st.patmMmHg.toFixed(1)} / 760 (≈ ${(st.patmMmHg / 760).toFixed(4)}) y tocá "Verificar" (o "⚡ Resolver y Explicar Cálculos").`;
                }
                if (inp) {
                  inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  inp.focus();
                }
                return;
              }
              st.fortinCalibrated = true;
              st.score += 10;
              window.AudioEngine.playRecordPoint();
              runTP1Stage('boyle');
            }
          }
        ],
        wbFortin
      );
    } else if (stageName === 'boyle') {
      const eq = window.TP1_Gases.computeBoyleEquilibrium(st);
      const allBoyleCalcsDone =
        st.calcSolved.boyle_dh &&
        st.calcSolved.boyle_vol &&
        st.calcSolved.boyle_pgas &&
        st.calcSolved.boyle_pv;

      const wbBoyle = {
        title: 'CÁLCULOS DE LA EXPERIENCIA 1: LEY DE BOYLE-MARIOTTE (Guía pág. 36)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Radio tubo (r):</strong> 0.50 cm (π ≈ 3.1416)</span>
          <span><strong>Long. columna gas (L):</strong> ${eq.L_cm.toFixed(2)} cm</span>
          <span><strong>Rama abierta (h_A):</strong> ${eq.hA_cm.toFixed(1)} cm</span>
          <span><strong>Rama cerrada (h_C):</strong> ${eq.hC_cm.toFixed(1)} cm</span>
          <span><strong>P_atm:</strong> ${st.patmMmHg.toFixed(1)} mmHg</span>
        `,
        fields: [
          {
            id: 'boyle_dh',
            label: '1. Diferencia de altura manométrica (Δh) en mmHg',
            formulaHint: 'Δh(cm) = h_A - h_C  →  multiplicá por 10 para pasar de cmHg a mmHg',
            unit: 'mmHg',
            targetValue: eq.deltaH_mmHg,
            decimals: 1,
            absTol: 1.0
          },
          {
            id: 'boyle_vol',
            label: '2. Volumen del gas encerrado (V)',
            formulaHint: 'V = π · r² · L   (con r = 0.50 cm y L = ' + eq.L_cm.toFixed(2) + ' cm)',
            unit: 'mL (cm³)',
            targetValue: eq.V_mL,
            decimals: 2,
            relTol: 0.015
          },
          {
            id: 'boyle_pgas',
            label: '3. Presión absoluta del gas (P_gas) en atm',
            formulaHint: 'P_gas(atm) = (P_atm + Δh) / 760',
            unit: 'atm',
            targetValue: eq.pGas_atm,
            decimals: 4,
            relTol: 0.01
          },
          {
            id: 'boyle_pv',
            label: '4. Producto isotérmico P · V',
            formulaHint: 'P · V = P_gas(atm) × V(mL)',
            unit: 'atm·mL',
            targetValue: eq.PV,
            decimals: 2,
            relTol: 0.02
          }
        ],
        onFieldSolved: () => {
          st.score += 5;
          updateHud();
        },
        onAllSolved: () => runTP1Stage('boyle')
      };

      const boyleMsg = allBoyleCalcsDone
        ? `«¡Muy bien! Ya verificaste las 4 magnitudes isotérmicas (P·V = ${eq.PV.toFixed(2)} atm·mL). Ahora podés anotar mediciones moviendo la rama del tubo, completar las 8 determinaciones y pasar al análisis de los 3 gráficos.»`
        : `«En la Experiencia 1 estudiamos la relación entre presión y volumen a temperatura constante (${st.tempAmbC.toFixed(1)} °C). Leé en el manómetro las alturas h_A, h_C y la longitud de la columna de gas L, y resolvé primero en la Mesa de Cálculos las 4 magnitudes para desbloquear el registro.»`;

      showDialog(
        'jtp',
        boyleMsg,
        [
          {
            label: '📝 Anotar medición actual en la tabla de la Bitácora',
            styleClass: 'rpg-btn-accent',
            disabled: !allBoyleCalcsDone,
            onClick: () => {
              const curEq = window.TP1_Gases.computeBoyleEquilibrium(st);
              const duplicate = st.boyleRows.some(r => Math.abs(r.deltaH_cm - curEq.deltaH_cm) < 0.4);
              if (!duplicate) {
                st.boyleRows.push({
                  index: st.boyleRows.length + 1,
                  ...curEq
                });
                st.score += 4;
                window.AudioEngine.playRecordPoint();
              }
              runTP1Stage('boyle');
            }
          },
          {
            label: '⚡ Completar las 8 determinaciones de la serie (desbloqueado tras verificar cálculo)',
            disabled: !allBoyleCalcsDone,
            onClick: () => {
              st.boyleRows = window.TP1_Gases.generateIdealBoyleSample();
              window.AudioEngine.playFanfare();
              runTP1Stage('boyle');
            }
          },
          {
            label: `📈 Pasar al análisis gráfico (P vs V, PV vs V y PV² vs V) [${st.boyleRows.length}/8]`,
            disabled: !allBoyleCalcsDone,
            onClick: () => {
              if (st.boyleRows.length < 4) {
                st.boyleRows = window.TP1_Gases.generateIdealBoyleSample();
              }
              runTP1Stage('boyle_graphs');
            }
          }
        ],
        wbBoyle
      );
    } else if (stageName === 'boyle_graphs') {
      let pertMsg =
        '«Analicemos los gráficos de la Guía y de los Segundos Parciales: P vs V es una hipérbola isotérmica; P vs 1/V es una recta que pasa por el origen con pendiente n·R·T; y P·V vs V es una recta horizontal constante. Probá los botones de abajo para ver cómo se modifican las curvas al variar la masa, la temperatura o el tipo de gas.»';
      if (st.boylePerturbation === 'more_mass_or_T') {
        pertMsg =
          '«🔴 Caso de Parcial (Mayor masa m₂ > m₁ o Mayor T₂ > T₁): Al aumentar el número de moles n o la temperatura T, el producto n·R·T aumenta. Por eso la hipérbola P vs V se ALEJA del origen, la pendiente de la recta P vs 1/V AUMENTA y la recta horizontal P·V sube.»';
      } else if (st.boylePerturbation === 'same_mass_co2') {
        pertMsg =
          '«🟠 Caso de Parcial (Igual masa pero de CO₂, PM = 44 > 28,8 g/mol): A igual masa en gramos, como el CO₂ tiene mayor masa molar que el aire/N₂, el número de moles n = m/PM es MENOR. La hipérbola P vs V se ACERCA al origen y la pendiente de P vs 1/V DISMINUYE.»';
      } else if (st.boylePerturbation === 'same_moles_co2') {
        pertMsg =
          '«🟢 Caso de Parcial (Igual número de moles de CO₂ u otro gas ideal): Como la ecuación de estado P·V = n·R·T depende únicamente del número de moles n y no de la identidad química del gas, ¡ninguno de los gráficos se modifica!»';
      }

      showDialog(
        'ayudante',
        pertMsg,
        [
          {
            label: '📊 Gráfico 1: P vs. V (Isoterma hiperbólica)',
            onClick: () => {
              st.boyleGraphType = 'P_vs_V';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '📈 Gráfico 2 (Parcial): P vs. 1/V (Recta por el origen, pendiente = n·R·T)',
            onClick: () => {
              st.boyleGraphType = 'P_vs_invV';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '📏 Gráfico 3: P·V vs. V (Recta horizontal = constante)',
            onClick: () => {
              st.boyleGraphType = 'PV_vs_V';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '📐 Gráfico 4: P·V² vs. V (Pendiente no nula, descarta PV² = cte)',
            onClick: () => {
              st.boyleGraphType = 'PV2_vs_V';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '🔴 ¿Qué pasa en el gráfico si aumentamos la masa (m₂ > m₁) o la temperatura (T₂ > T₁)?',
            onClick: () => {
              st.boylePerturbation = st.boylePerturbation === 'more_mass_or_T' ? 'none' : 'more_mass_or_T';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '🟠 ¿Qué pasa si reemplazamos el gas por IGUAL MASA de CO₂ (PM = 44)?',
            onClick: () => {
              st.boylePerturbation = st.boylePerturbation === 'same_mass_co2' ? 'none' : 'same_mass_co2';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '🟢 ¿Qué pasa si reemplazamos el gas por IGUAL NÚMERO DE MOLES de CO₂?',
            onClick: () => {
              st.boylePerturbation = st.boylePerturbation === 'same_moles_co2' ? 'none' : 'same_moles_co2';
              runTP1Stage('boyle_graphs');
            }
          },
          {
            label: '🔥 Avanzar a la Experiencia 2: Ley de Charles y Gay-Lussac (V = cte)',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.glBathTempC = 42.0;
              const gl = window.TP1_Gases.computeGayLussacState(st);
              st.glManometerAdjustMm = Number(gl.deltaHTarget_mm.toFixed(1));
              runTP1Stage('gay_lussac');
            }
          }
        ],
        null
      );
    } else if (stageName === 'gay_lussac') {
      const gl = window.TP1_Gases.computeGayLussacState(st);
      const glCalcsDone = st.calcSolved.gl_tk && st.calcSolved.gl_pgas;

      const wbGL = {
        title: 'CÁLCULOS DE LA EXPERIENCIA 2: TERMÓMETRO DE GAS A VOLUMEN CONSTANTE',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Temp. del baño (t):</strong> ${st.glBathTempC.toFixed(1)} °C</span>
          <span><strong>Desnivel en aforo (Δh):</strong> +${st.glManometerAdjustMm.toFixed(1)} mmHg</span>
          <span><strong>P_atm:</strong> ${st.patmMmHg.toFixed(1)} mmHg</span>
        `,
        fields: [
          {
            id: 'gl_tk',
            label: '1. Temperatura absoluta del baño (T)',
            formulaHint: 'T(K) = t(°C) + 273.15',
            unit: 'K',
            targetValue: gl.T_K,
            decimals: 2,
            absTol: 0.2
          },
          {
            id: 'gl_pgas',
            label: '2. Presión del gas a volumen constante (P_gas)',
            formulaHint: 'P_gas(atm) = (P_atm + Δh) / 760',
            unit: 'atm',
            targetValue: gl.pMeasured_atm,
            decimals: 4,
            relTol: 0.01
          }
        ],
        onFieldSolved: () => {
          st.score += 5;
          updateHud();
        },
        onAllSolved: () => runTP1Stage('gay_lussac')
      };

      let glMsg = `«En la Experiencia 2 calentamos la ampolla en un baño de agua (actualmente a ${st.glBathTempC.toFixed(1)} °C). Ajustá la rama libre hasta que el mercurio quede enrasado en la marca de AFORO (volumen constante).»`;
      if (gl.isEnrasado && !glCalcsDone) {
        glMsg = `«¡Menisco enrasado en el AFORO (Δh = +${st.glManometerAdjustMm.toFixed(1)} mmHg)! Ahora calculá en la Mesa de Cálculos de arriba la temperatura absoluta T (en K) y la presión P_gas (en atm).»`;
      } else if (gl.isEnrasado && glCalcsDone) {
        glMsg = `«¡Excelente! Con el menisco enrasado y los cálculos de T y P_gas verificados, podés registrar el punto térmico o pasar a la extrapolación del Cero Absoluto.»`;
      }

      showDialog(
        'jtp',
        glMsg,
        [
          {
            label: gl.isEnrasado
              ? '✓ 1° Menisco enrasado exactamente en la marca de AFORO'
              : '🎯 1° Enrasar menisco exactamente en la marca de AFORO',
            disabled: gl.isEnrasado,
            onClick: () => {
              const target = window.TP1_Gases.computeGayLussacState(st).deltaHTarget_mm;
              st.glManometerAdjustMm = Number(target.toFixed(1));
              window.AudioEngine.playDialTick(true);
              runTP1Stage('gay_lussac');
            }
          },
          {
            label: '📝 2° Registrar punto en la Bitácora y calentar baño (+10 °C)',
            styleClass: 'rpg-btn-accent',
            disabled: !gl.isEnrasado || !glCalcsDone,
            onClick: () => {
              const curGl = window.TP1_Gases.computeGayLussacState(st);
              const exists = st.glRows.some(r => Math.abs(r.t_C - st.glBathTempC) < 1.5);
              if (!exists) {
                st.glRows.push({
                  index: st.glRows.length + 1,
                  t_C: st.glBathTempC,
                  T_K: curGl.T_K,
                  hA_cm: curGl.hA_cm,
                  hC_cm: curGl.hC_cm,
                  deltaH_mm: st.glManometerAdjustMm,
                  P_mmHg: curGl.pMeasured_mmHg,
                  P_atm: curGl.pMeasured_atm
                });
                window.AudioEngine.playRecordPoint();
              }
              if (st.glBathTempC < 75) {
                st.glBurnerOn = true;
                st.glBathTempC = Math.min(82.0, st.glBathTempC + 10.0);
                const nextGl = window.TP1_Gases.computeGayLussacState(st);
                st.glManometerAdjustMm = Number(nextGl.deltaHTarget_mm.toFixed(1));
                window.AudioEngine.playFlame();
              }
              runTP1Stage('gay_lussac');
            }
          },
          {
            label: '📈 3° Completar serie térmica y extrapolar el Cero Absoluto',
            disabled: !glCalcsDone,
            onClick: () => {
              if (st.glRows.length < 3) {
                st.glRows = window.TP1_Gases.generateIdealGayLussacSample();
              }
              st.glBurnerOn = false;
              runTP1Stage('gl_graph');
            }
          }
        ],
        wbGL
      );
    } else if (stageName === 'gl_graph') {
      const rows = st.glRows.length >= 2 ? st.glRows : window.TP1_Gases.generateIdealGayLussacSample();
      const pts = rows.map(r => ({ x: r.t_C, y: r.P_atm }));
      const reg = window.LabCommon.linearRegression(pts);
      const tZeroTarget = -reg.intercept / reg.slope;

      const wbZero = {
        title: 'EXTRAPOLACIÓN LINEAL AL CERO ABSOLUTO (P → 0)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Recta de regresión:</strong> P(t) = a + b · t</span>
          <span><strong>Ordenada al origen (a):</strong> ${reg.intercept.toFixed(4)} atm</span>
          <span><strong>Pendiente térmica (b):</strong> ${reg.slope.toFixed(5)} atm/°C</span>
        `,
        fields: [
          {
            id: 'gl_tzero',
            label: 'Temperatura en °C donde la presión se anularía (P = 0)',
            formulaHint: 'Si 0 = a + b · t₀  →  t₀ = -a / b  (no olvides el signo negativo)',
            unit: '°C',
            targetValue: tZeroTarget,
            decimals: 1,
            relTol: 0.015
          }
        ],
        onFieldSolved: () => {
          st.score += 10;
          updateHud();
        },
        onAllSolved: () => runTP1Stage('gl_graph')
      };

      let glGraphMsg =
        '«A partir de la ordenada al origen (a) y la pendiente (b) de la recta P vs. t (°C), calculá a qué temperatura centígrada (t₀) se haría cero la presión del gas ideal. Además, podés probar abajo las preguntas clásicas de parcial sobre cómo varían la pendiente, la ordenada y el corte en P=0.»';
      if (st.glPerturbation === 'larger_bulb') {
        glGraphMsg =
          '«🔵 Caso de Parcial (Mayor volumen de bulbo con igual masa): Como P(t) = (n·R/V)·(t + 273,15), al aumentar V DISMINUYEN tanto la pendiente (n·R/V) como la ordenada al origen a 0 °C, pero la intersección con el eje de temperatura (P = 0) sigue siendo exactamente -273,15 °C.»';
      } else if (st.glPerturbation === 'more_mass') {
        glGraphMsg =
          '«🔴 Caso de Parcial (Mayor masa de gas a igual V): Al aumentar el número de moles n, AUMENTAN la pendiente y la ordenada al origen, pero la recta sigue cortando el eje horizontal en el Cero Absoluto (-273,15 °C).»';
      } else if (st.glPerturbation === 'same_mass_co2') {
        glGraphMsg =
          '«🟠 Caso de Parcial (Igual masa pero de CO₂, PM = 44 > 28,8): Hay menos moles n dentro del bulbo, por lo que DISMINUYEN la pendiente y la ordenada al origen, cortando nuevamente en -273,15 °C.»';
      }

      showDialog(
        'ayudante',
        glGraphMsg,
        [
          {
            label: '🔵 ¿Qué pasa con la recta si usamos igual masa en un bulbo de MAYOR VOLUMEN?',
            onClick: () => {
              st.glPerturbation = st.glPerturbation === 'larger_bulb' ? 'none' : 'larger_bulb';
              runTP1Stage('gl_graph');
            }
          },
          {
            label: '🔴 ¿Qué pasa con la recta si inyectamos MÁS MASA de aire en el mismo bulbo?',
            onClick: () => {
              st.glPerturbation = st.glPerturbation === 'more_mass' ? 'none' : 'more_mass';
              runTP1Stage('gl_graph');
            }
          },
          {
            label: '🟠 ¿Qué pasa si reemplazamos el aire por IGUAL MASA de CO₂ (PM = 44)?',
            onClick: () => {
              st.glPerturbation = st.glPerturbation === 'same_mass_co2' ? 'none' : 'same_mass_co2';
              runTP1Stage('gl_graph');
            }
          },
          {
            label: '🧪 Avanzar a la Experiencia 3: Ley de Difusión de Graham (NH₃ + HCl)',
            styleClass: 'rpg-btn-accent',
            disabled: !st.calcSolved.gl_tzero,
            onClick: () => runTP1Stage('graham')
          }
        ],
        wbZero
      );
    } else if (stageName === 'graham') {
      const ratioExp = st.dNH3_cm / st.dHCl_cm;
      const ratioTeo = Math.sqrt(36.461 / 17.031);
      const allGrahamDone =
        st.calcSolved.graham_dhcl && st.calcSolved.graham_rexp && st.calcSolved.graham_rteo;

      const wbGraham = st.grahamRingFormed
        ? {
            title: 'CÁLCULOS DE LA EXPERIENCIA 3: LEY DE DIFUSIÓN DE GRAHAM (Guía pág. 38)',
            showAutoSolve: true,
            solvedMap: st.calcSolved,
            dataStripHtml: `
              <span><strong>Longitud total del tubo (L_total):</strong> 60.00 cm</span>
              <span><strong>Distancia desde NH₃ al anillo:</strong> d(NH₃) = ${st.dNH3_cm.toFixed(2)} cm</span>
              <span><strong>Masas molares:</strong> M(NH₃) = 17.03 g/mol | M(HCl) = 36.46 g/mol</span>
            `,
            fields: [
              {
                id: 'graham_dhcl',
                label: '1. Distancia recorrida por el HCl hasta el anillo: d(HCl)',
                formulaHint: 'd(HCl) = L_total - d(NH₃) = 60.00 - 35.65',
                unit: 'cm',
                targetValue: st.dHCl_cm,
                decimals: 2,
                absTol: 0.15
              },
              {
                id: 'graham_rexp',
                label: '2. Relación experimental de velocidades (v_NH₃ / v_HCl)',
                formulaHint: 'v_NH₃ / v_HCl = d(NH₃) / d(HCl)',
                unit: 'adim.',
                targetValue: ratioExp,
                decimals: 3,
                relTol: 0.015
              },
              {
                id: 'graham_rteo',
                label: '3. Relación teórica según la Ley de Graham',
                formulaHint: '√(M_HCl / M_NH₃) = sqrt(36.46 / 17.03)',
                unit: 'adim.',
                targetValue: ratioTeo,
                decimals: 3,
                relTol: 0.015
              }
            ],
            onFieldSolved: () => {
              st.score += 5;
              updateHud();
            },
            onAllSolved: () => runTP1Stage('graham')
          }
        : null;

      showDialog(
        'jtp',
        st.grahamRingFormed
          ? '«¡Se formó el anillo blanco de NH₄Cl sólido! Como ambos vapores partieron al mismo instante, la razón de sus velocidades medias de difusión es igual al cociente de las distancias recorridas. Completá los tres cálculos en la mesa de trabajo para verificar la Ley de Graham.»'
          : '«En la Experiencia 3 colocamos simultáneamente en ambos extremos de un tubo de vidrio de 60,00 cm un hisopo con NH₃ concentrado (M = 17,03 g/mol) y otro con HCl concentrado (M = 36,46 g/mol). Iniciá la difusión para observar dónde se forma el anillo de NH₄Cl(s).»',
        [
          {
            label: st.grahamRingFormed ? '✓ Difusión realizada' : '▶ Colocar ambos hisopos simultáneamente e iniciar difusión',
            styleClass: st.grahamRingFormed ? '' : 'rpg-btn-accent',
            disabled: st.grahamRingFormed || st.grahamRunning,
            onClick: () => {
              st.grahamRunning = true;
              st.grahamProgress = 0;
              if (app.grahamAnimId) clearInterval(app.grahamAnimId);
              app.grahamAnimId = setInterval(() => {
                st.grahamProgress += 0.05;
                if (st.grahamProgress >= 1.0) {
                  st.grahamProgress = 1.0;
                  st.grahamRunning = false;
                  st.grahamRingFormed = true;
                  st.grahamMeasured = true;
                  clearInterval(app.grahamAnimId);
                  app.grahamAnimId = null;
                  window.AudioEngine.playGlassClink();
                  runTP1Stage('graham');
                }
              }, 60);
            }
          },
          {
            label: '🎓 Pasar a la pregunta conceptual de evaluación del TP 1',
            styleClass: 'rpg-btn-accent',
            disabled: !st.grahamRingFormed || !allGrahamDone,
            onClick: () => runTP1Stage('quiz')
          },
          {
            label: '📖 Abrir Bitácora de Laboratorio',
            onClick: () => toggleLogbook(true)
          }
        ],
        wbGraham
      );
    } else if (stageName === 'quiz') {
      showDialog(
        'jtp',
        '«Pregunta integradora (Problema 17 de la Guía): Dos gases A y B difunden desde los extremos de un tubo de 25,0 cm y se encuentran a 10,0 cm del extremo donde se colocó B (por lo tanto, d_A = 15,0 cm y d_B = 10,0 cm). Si el gas A tiene un peso molecular M_A = 16,0 g/mol, ¿cuál es el peso molecular del gas B?»',
        [
          {
            label: 'A) M_B = 36,0 g/mol, ya que d_A / d_B = 1,5 = √(M_B / 16) → M_B = 16 × (1,5)² = 36,0 g/mol',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.score = 100;
              window.AudioEngine.playFanfare();
              showDialog(
                'jtp',
                '«¡Excelente resolución! Aplicaste la Ley de Graham elevando al cuadrado la razón de distancias: M_B = M_A · (d_A / d_B)² = 16 × 2,25 = 36,0 g/mol. ¡Has completado todos los cálculos y experiencias del TP 1!»',
                [
                  { label: '📖 Ver Bitácora y Exportar Informe (.TXT / .CSV)', styleClass: 'rpg-btn-accent', onClick: () => toggleLogbook(true) },
                  { label: '🏠 Volver a la Recepción para elegir otro TP', onClick: () => enterHub() }
                ],
                null
              );
            }
          },
          {
            label: 'B) M_B = 24,0 g/mol, haciendo una proporción lineal directa 16 × (15 / 10)',
            onClick: () => {
              window.AudioEngine.playError();
              showDialog(
                'ayudante',
                '«¡Cuidado! La relación de velocidades de difusión es inversamente proporcional a la RAÍZ CUADRADA de los pesos moleculares: d_A / d_B = √(M_B / M_A). Tenés que elevar el cociente (15/10 = 1,5) al cuadrado antes de multiplicar por 16.»',
                [{ label: 'Reintentar la pregunta', onClick: () => runTP1Stage('quiz') }],
                null
              );
            }
          }
        ],
        null
      );
    }
  }

  // =========================================================================
  // FLUJO INTERACTIVO Y CÁLCULOS DEL TP 2: DENSIDAD DE GASES (CO2)
  // =========================================================================
  function startTP2() {
    app.activeTp = 'tp2';
    window.TP2_Densidad.reset();
    runTP2Stage('vacio');
  }

  function runTP2Stage(stageName) {
    const st = window.TP2_Densidad.getState();
    st.stage = stageName;

    if (stageName === 'vacio') {
      showDialog(
        'jtp',
        '«En el TP 2 determinaremos la densidad del CO₂. Seguí con cuidado la técnica de vacío en la Ampolla de Regnault: 1) Abrí la Llave A que conecta con la bomba (manteniendo cerrada la Llave B), 2) Encendé la bomba rotatoria hasta alcanzar alto vacío (< 0,1 mmHg), y 3) Cerrá la Llave A antes de retirar la ampolla para pesar m₀.»',
        [
          {
            label: st.valveAmpAOpen ? '🔓 Llave A: ABIERTA (Clic para cerrar)' : '🔒 1° Abrir Llave A de la ampolla hacia el tren de vacío',
            onClick: () => {
              st.valveAmpAOpen = !st.valveAmpAOpen;
              window.AudioEngine.playValve();
              runTP2Stage('vacio');
            }
          },
          {
            label: st.vacuumDone ? '✓ Vacío alcanzado (< 0,1 mmHg)' : '🔌 2° Encender bomba rotatoria y evacuar aire (Vacío óptimo < 0,1 mmHg)',
            disabled: !st.valveAmpAOpen || st.vacuumDone,
            onClick: () => {
              st.pumpRunning = true;
              st.errors.residualPressureCmHg = 0.0;
              window.AudioEngine.playPump();
              setTimeout(() => {
                st.pumpRunning = false;
                st.vacuumDone = true;
                st.score += 10;
                window.TP2_Densidad.computeM0();
                runTP2Stage('vacio');
              }, 400);
            }
          },
          {
            label: '⚠️ Simular error de parcial: Hacer vacío insuficiente (dejar P_res = 25 mmHg de aire en m₀)',
            styleClass: 'rpg-btn-warn',
            disabled: !st.valveAmpAOpen || (st.vacuumDone && st.errors.residualPressureCmHg > 0),
            onClick: () => {
              st.pumpRunning = true;
              st.errors.residualPressureCmHg = 2.5; // 25 mmHg de aire residual
              window.AudioEngine.playPump();
              setTimeout(() => {
                st.pumpRunning = false;
                st.vacuumDone = true;
                window.TP2_Densidad.computeM0();
                runTP2Stage('vacio');
              }, 350);
            }
          },
          {
            label: '⚖️ 3° Llevar ampolla (con Llave A cerrada) a la balanza analítica para medir m₀',
            styleClass: 'rpg-btn-accent',
            disabled: !st.vacuumDone || st.valveAmpAOpen,
            onClick: () => runTP2Stage('pesar_m0')
          }
        ],
        null
      );
    } else if (stageName === 'pesar_m0') {
      st.m0Weighed = true;
      const m0 = window.TP2_Densidad.computeM0();
      window.AudioEngine.playBalanceBeep();
      showDialog(
        'ayudante',
        `«Registramos en la balanza analítica la masa de la ampolla vacía: m₀ = ${m0.toFixed(4)} g. Ahora conectemos la ampolla al tren purificador (H₂O → H₂SO₄ → Sílica Gel) y al Aparato de Kipp para llenarla con CO₂ seco y libre de HCl.»`,
        [
          {
            label: '🧪 Conectar al Aparato de Kipp y al Tren Purificador de CO₂',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.valveAmpAOpen = false;
              st.valveAmpBOpen = false;
              st.valveKippOpen = false;
              runTP2Stage('kipp_tren');
            }
          }
        ],
        null
      );
    } else if (stageName === 'kipp_tren') {
      showDialog(
        'jtp',
        '«Sigamos el protocolo de llenado de la página 41 de la Guía: 1) Purgá el Aparato de Kipp para desplazar el aire del tren; 2) Abrí las llaves de entrada y salida para que circule CO₂ durante 10-15 minutos; 3) Cerrá las llaves en el orden estricto: primero la salida a la atmósfera, luego la entrada de la ampolla y por último el Kipp.»',
        [
          {
            label: st.kippPurged ? '✓ 1° Tren purgado y CO₂ circulando' : '💨 1° Abrir Kipp, purgar aire del tren y hacer circular CO₂ por la ampolla',
            styleClass: st.kippPurged ? '' : 'rpg-btn-accent',
            disabled: st.kippPurged,
            onClick: () => {
              st.kippPurged = true;
              st.valveKippOpen = true;
              st.valveAmpAOpen = true;
              st.valveAmpBOpen = true;
              window.AudioEngine.playBubble();
              runTP2Stage('kipp_tren');
            }
          },
          {
            label: '🔒 2° Cerrar en orden correcto: 1° Salida atmósfera → 2° Entrada ampolla → 3° Llave Kipp',
            styleClass: 'rpg-btn-accent',
            disabled: !st.kippPurged,
            onClick: () => {
              st.ampollaFilledCo2 = true;
              st.valveAmpBOpen = false;
              st.valveAmpAOpen = false;
              st.valveKippOpen = false;
              st.score += 15;
              window.AudioEngine.playValve();
              runTP2Stage('equilibrar_m1');
            }
          },
          {
            label: st.errors.missingH2SO4Flask
              ? '✓ Frasco 2 (H₂SO₄) y 3 (Sílica): OMITIDOS (Pasa vapor de H₂O → Error por DEFECTO)'
              : '⚠️ Simular error: Omitir desecadores H₂SO₄/Sílica (entra vapor de H₂O, PM=18 < 44)',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              st.errors.missingH2SO4Flask = !st.errors.missingH2SO4Flask;
              st.errors.missingSilicaFlask = st.errors.missingH2SO4Flask;
              runTP2Stage('kipp_tren');
            }
          },
          {
            label: st.errors.missingWaterFlask
              ? '✓ Frasco 1 (H₂O): OMITIDO (Pasa HCl(g) → Error por DEFECTO)'
              : '⚠️ Simular error: Omitir Frasco 1 de agua (pasa HCl gaseoso, PM=36,5 < 44)',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              st.errors.missingWaterFlask = !st.errors.missingWaterFlask;
              runTP2Stage('kipp_tren');
            }
          },
          {
            label: st.errors.so3ImpurityInKipp
              ? '✓ Impureza SO₃ en Kipp: ACTIVA (PM=80 > 44 → Error por EXCESO)'
              : '⚠️ Simular error (Parcial 2023): En el Kipp se genera SO₃(g) (PM=80 > 44) no retenido',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              st.errors.so3ImpurityInKipp = !st.errors.so3ImpurityInKipp;
              runTP2Stage('kipp_tren');
            }
          }
        ],
        null
      );
    } else if (stageName === 'equilibrar_m1') {
      showDialog(
        'jtp',
        '«Al haber cerrado primero la salida a la atmósfera y luego la conexión al Kipp, el CO₂ dentro de la ampolla quedó a una presión ligeramente superior a la atmosférica. Damos ahora un rápido giro de 180° a una de las llaves de la ampolla para liberar el exceso de CO₂ e igualar la presión interna con P_atm antes de pesar m₁.»',
        [
          {
            label: '🔄 Dar giro rápido de 180° a la llave (Equilibrar P = P_atm) y pesar m₁',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.errors.skipEqualize180 = false;
              st.pressureEqualized180 = true;
              st.m1Weighed = true;
              st.score += 15;
              const m1 = window.TP2_Densidad.computeM1();
              window.AudioEngine.playValve();
              setTimeout(() => window.AudioEngine.playBalanceBeep(), 180);
              showDialog(
                'ayudante',
                `«¡Muy bien! La presión interna quedó igualada con P_atm (${st.patmTorr.toFixed(1)} torr) y pesamos en la balanza analítica la ampolla llena de CO₂: m₁ = ${m1.toFixed(4)} g. Pasemos ahora a determinar el volumen de la ampolla con agua destilada.»`,
                [
                  {
                    label: '💧 Pasar a calibrar el volumen con agua destilada hervida (m₂)',
                    styleClass: 'rpg-btn-accent',
                    onClick: () => runTP2Stage('agua_m2')
                  }
                ],
                null
              );
            }
          },
          {
            label: '⚠️ Omitir el giro de 180° y pesar directamente con sobrepresión (Simular error)',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              st.errors.skipEqualize180 = true;
              st.pressureEqualized180 = false;
              st.m1Weighed = true;
              const m1 = window.TP2_Densidad.computeM1();
              window.AudioEngine.playBalanceBeep();
              showDialog(
                'alerta',
                `«Omitiste el giro de 180°: la ampolla conserva la sobrepresión de la columna de HCl del Kipp y contiene una masa mayor (m₁ = ${m1.toFixed(4)} g). Verás cómo repercute en tu cálculo de densidad.»`,
                [{ label: '💧 Continuar al llenado con agua (m₂)', onClick: () => runTP2Stage('agua_m2') }],
                null
              );
            }
          }
        ],
        null
      );
    } else if (stageName === 'agua_m2') {
      showDialog(
        'jtp',
        `«Llenamos completamente la ampolla con agua destilada (previamente hervida para expulsar gases disueltos y enfriada a ${st.tempAguaC.toFixed(1)} °C) cuidando que no queden burbujas adheridas, y la pesamos en balanza granataria para obtener m₂.»`,
        [
          {
            label: '💧 Llenar ampolla con agua destilada desgasificada sin burbujas y pesar m₂ (Óptimo)',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.errors.airBubblesWaterMl = 0.0;
              st.waterFilled = true;
              st.m2Weighed = true;
              st.score += 10;
              window.TP2_Densidad.computeM2();
              window.TP2_Densidad.performFinalCalculations();
              window.AudioEngine.playBalanceBeep();
              runTP2Stage('calculos');
            }
          },
          {
            label: '⚠️ Simular error de parcial: Dejar burbujas de aire al llenar con agua (subestima V → δ por EXCESO)',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              st.errors.airBubblesWaterMl = 12.5;
              st.waterFilled = true;
              st.m2Weighed = true;
              window.TP2_Densidad.computeM2();
              window.TP2_Densidad.performFinalCalculations();
              window.AudioEngine.playBalanceBeep();
              showDialog(
                'alerta',
                `«⚠️ Mirá en el dibujo de la ampolla: quedaron 12,5 mL de burbujas de aire adheridas a las paredes internas. Por eso la masa con agua bajó a m₂ = ${st.measured.m2_g.toFixed(2)} g, lo que subestimará el volumen V de la ampolla y dará un error por EXCESO en la densidad.»`,
                [
                  {
                    label: '📊 Pasar al pizarrón de cálculos para comprobar el error por exceso',
                    styleClass: 'rpg-btn-accent',
                    onClick: () => runTP2Stage('calculos')
                  },
                  {
                    label: '🔄 Golpear suavemente para eliminar las burbujas y volver a pesar m₂',
                    onClick: () => {
                      st.errors.airBubblesWaterMl = 0.0;
                      window.TP2_Densidad.computeM2();
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  }
                ],
                null
              );
            }
          }
        ],
        null
      );
    } else if (stageName === 'calculos') {
      const calc = window.TP2_Densidad.performFinalCalculations();
      const allTp2Solved =
        st.calcSolved.m_agua &&
        st.calcSolved.v_ampolla &&
        st.calcSolved.m_co2 &&
        st.calcSolved.delta_exp &&
        st.calcSolved.delta_cntp &&
        st.calcSolved.err_rel;

      const wbTp2 = {
        title: 'MESA DE CÁLCULOS DEL ESTUDIANTE — DENSIDAD DEL CO₂ Y REDUCCIÓN A CNTP (Guía pág. 42)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>m₀ (vacía):</strong> ${st.measured.m0_g.toFixed(4)} g</span>
          <span><strong>m₁ (con CO₂):</strong> ${st.measured.m1_g.toFixed(4)} g</span>
          <span><strong>m₂ (con H₂O):</strong> ${st.measured.m2_g.toFixed(2)} g</span>
          <span><strong>δ_agua (${st.tempAguaC.toFixed(1)}°C):</strong> ${calc.rhoAgua.toFixed(5)} g/mL</span>
          <span><strong>T_amb:</strong> ${st.tempAmbC.toFixed(1)} °C (${(st.tempAmbC + 273.15).toFixed(2)} K)</span>
          <span><strong>P_atm:</strong> ${st.patmTorr.toFixed(1)} torr</span>
        `,
        fields: [
          {
            id: 'm_agua',
            label: '1. Masa de agua en la ampolla (m_H₂O)',
            formulaHint: 'm_H₂O = m₂ - m₀',
            unit: 'g',
            targetValue: calc.mAguaAparenteG,
            decimals: 2,
            absTol: 0.15
          },
          {
            id: 'v_ampolla',
            label: '2. Volumen de la ampolla de Regnault (V)',
            formulaHint: 'V(mL) = m_H₂O / δ_agua',
            unit: 'mL',
            targetValue: calc.vAmpollaMl,
            decimals: 2,
            absTol: 0.3
          },
          {
            id: 'm_co2',
            label: '3. Masa de gas CO₂ contenida en la ampolla (m_CO₂)',
            formulaHint: 'm_CO₂ = m₁ - m₀',
            unit: 'g',
            targetValue: calc.mGasAparenteG,
            decimals: 4,
            absTol: 0.002
          },
          {
            id: 'delta_exp',
            label: '4. Densidad experimental del CO₂ a T_amb y P_atm (δ_exp)',
            formulaHint: 'δ_exp (g/L) = m_CO₂(g) / V(L)   (¡Recordá pasar V de mL a L dividiendo por 1000!)',
            unit: 'g/L',
            targetValue: calc.deltaExpGL,
            decimals: 4,
            relTol: 0.015
          },
          {
            id: 'delta_cntp',
            label: '5. Densidad del CO₂ proyectada a CNTP (273.15 K y 760 torr)',
            formulaHint: 'δ_CNTP = δ_exp × (T_amb(K) / 273.15) × (760 / P_atm(torr))',
            unit: 'g/L',
            targetValue: calc.deltaCntpExpGL,
            decimals: 4,
            relTol: 0.015
          },
          {
            id: 'err_rel',
            label: '6. Error relativo porcentual respecto a δ_ideal,CNTP (1.9635 g/L)',
            formulaHint: 'E_r% = ((δ_CNTP - 1.9635) / 1.9635) × 100',
            unit: '%',
            targetValue: calc.relErrorPercent,
            decimals: 2,
            absTol: 0.25
          }
        ],
        onFieldSolved: () => {
          st.score += 6;
          updateHud();
        },
        onAllSolved: () => runTP2Stage('calculos')
      };

      showDialog(
        'jtp',
        allTp2Solved
          ? `«¡Excelente trabajo con todos los cálculos! Determinaste V = ${calc.vAmpollaMl.toFixed(2)} mL, δ_exp = ${calc.deltaExpGL.toFixed(4)} g/L y δ_CNTP = ${calc.deltaCntpExpGL.toFixed(4)} g/L (Error: ${calc.relErrorPercent.toFixed(2)} %). Ahora podés responder la pregunta conceptual de análisis de errores o exportar tu informe.»`
          : '«Ya tenemos las tres pesadas (m₀, m₁ y m₂). Usá la calculadora integrada y las fórmulas de la guía para resolver paso a paso los 6 ítems en tu Mesa de Cálculos y completar el pizarrón.»',
        [
          {
            label: '🎓 Responder pregunta conceptual de análisis de errores (Guía pág. 42)',
            styleClass: 'rpg-btn-accent',
            disabled: !allTp2Solved,
            onClick: () => runTP2Stage('quiz')
          },
          {
            label: '⚠️ Probar en vivo los 6 Errores Experimentales de Parcial sobre el Pizarrón',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              Object.keys(st.calcSolved).forEach(k => (st.calcSolved[k] = true));
              window.TP2_Densidad.performFinalCalculations();
              showDialog(
                'ayudante',
                '«Activá o desactivá cualquiera de los errores clásicos de Segundo Parcial y mirá arriba en el pizarrón cómo varían m₀, m₁, m₂, el Volumen V y la Densidad δ(CNTP), indicando si produce error por EXCESO (+) o por DEFECTO (-):»',
                [
                  {
                    label: `${st.errors.skipEqualize180 ? '✅' : '⬜'} 1) No equilibrar llave 180° tras desconectar del Kipp (+P_Kipp → EXCESO)`,
                    onClick: () => {
                      st.errors.skipEqualize180 = !st.errors.skipEqualize180;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.residualPressureCmHg > 0 ? '✅' : '⬜'} 2) Vacío insuficiente antes de pesar m₀ (queda aire residual → DEFECTO)`,
                    onClick: () => {
                      st.errors.residualPressureCmHg = st.errors.residualPressureCmHg > 0 ? 0.0 : 2.5;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.airBubblesWaterMl > 0 ? '✅' : '⬜'} 3) Quedan burbujas de aire al llenar con agua en m₂ (-V ampolla → EXCESO)`,
                    onClick: () => {
                      st.errors.airBubblesWaterMl = st.errors.airBubblesWaterMl > 0 ? 0.0 : 12.5;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.missingH2SO4Flask ? '✅' : '⬜'} 4) Entra vapor de agua por el tren lavador (PM 18 < 44 → DEFECTO)`,
                    onClick: () => {
                      st.errors.missingH2SO4Flask = !st.errors.missingH2SO4Flask;
                      st.errors.missingSilicaFlask = st.errors.missingH2SO4Flask;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.missingWaterFlask ? '✅' : '⬜'} 5) Omitir primer frasco lavador con agua (pasa HCl PM 36,5 < 44 → DEFECTO)`,
                    onClick: () => {
                      st.errors.missingWaterFlask = !st.errors.missingWaterFlask;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.so3ImpurityInKipp ? '✅' : '⬜'} 6) En el Kipp se genera SO₃ no retenido (PM 80 > 44 → EXCESO)`,
                    onClick: () => {
                      st.errors.so3ImpurityInKipp = !st.errors.so3ImpurityInKipp;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  },
                  {
                    label: '✨ Restaurar experiencia ideal sin errores y volver a los cálculos',
                    styleClass: 'rpg-btn-accent',
                    onClick: () => {
                      st.errors.skipEqualize180 = false;
                      st.errors.residualPressureCmHg = 0.0;
                      st.errors.airBubblesWaterMl = 0.0;
                      st.errors.missingH2SO4Flask = false;
                      st.errors.missingSilicaFlask = false;
                      st.errors.missingWaterFlask = false;
                      st.errors.so3ImpurityInKipp = false;
                      window.TP2_Densidad.performFinalCalculations();
                      runTP2Stage('calculos');
                    }
                  }
                ],
                wbTp2
              );
            }
          },
          {
            label: '📖 Abrir Bitácora y Exportar Informe (.TXT / .CSV)',
            onClick: () => toggleLogbook(true)
          },
          {
            label: '🔄 Reiniciar TP 2',
            onClick: () => startTP2()
          }
        ],
        wbTp2
      );
    } else if (stageName === 'quiz') {
      showDialog(
        'jtp',
        '«Pregunta de análisis de errores (pág. 42 de la Guía): ¿Cómo se vería afectado el valor experimental de la densidad del CO₂ si se eliminaran el segundo y tercer frasco del tren purificador (H₂SO₄ y sílica gel), dejando pasar vapor de agua hacia la ampolla?»',
        [
          {
            label: 'A) La densidad medida sería MENOR que la real, porque el H₂O(g) (PM = 18 g/mol) es más liviano que el CO₂ (PM = 44 g/mol)',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.score = 100;
              window.AudioEngine.playFanfare();
              showDialog(
                'jtp',
                '«¡Respuesta exacta! Al reemplazar moléculas de CO₂ (44 g/mol) por moléculas de vapor de agua (18 g/mol) a las mismas condiciones de P y T, la masa total m₁ disminuye y, por lo tanto, la densidad calculada resulta menor que la del CO₂ puro.»',
                [
                  { label: '📖 Ver Bitácora y Exportar Informe (.TXT / .CSV)', styleClass: 'rpg-btn-accent', onClick: () => toggleLogbook(true) },
                  { label: '🏠 Volver a la Recepción para elegir otro TP', onClick: () => enterHub() }
                ],
                null
              );
            }
          },
          {
            label: 'B) La densidad medida sería MAYOR que la real, porque el agua líquida es muy densa',
            onClick: () => {
              window.AudioEngine.playError();
              showDialog(
                'ayudante',
                '«Cuidado: el agua que pasa como humedad en la corriente gaseosa está en fase VAPOR. Por la Ley de Avogadro, un mol de cualquier gas ocupa el mismo volumen a igual P y T; compará el peso molecular del vapor de agua (18 g/mol) frente al del CO₂ (44 g/mol).»',
                [{ label: 'Reintentar la pregunta', onClick: () => runTP2Stage('quiz') }],
                null
              );
            }
          }
        ],
        null
      );
    }
  }

  // =========================================================================
  // FLUJO INTERACTIVO Y CÁLCULOS DEL TP 3: MÉTODO DE VÍCTOR MEYER
  // =========================================================================
  function startTP3() {
    app.activeTp = 'tp3';
    window.TP3_VictorMeyer.reset();
    runTP3Stage('preparacion');
  }

  function runTP3Stage(stageName) {
    const st = window.TP3_VictorMeyer.getState();
    const sub = window.TP3_VictorMeyer.getCurrentSubstance();
    st.stage = stageName;

    if (stageName === 'preparacion') {
      showDialog(
        'jtp',
        `«Vamos a determinar el peso molecular de nuestra muestra volátil (${sub.name}, Fórmula mínima: ${sub.empirical}, T_eb = ${sub.bp} °C) por el Método de Víctor Meyer. Seguí los 3 pasos de puesta a régimen: 1) Encendé el mechero hasta hervir el baño a 100 °C, 2) Insuflá aire seco 3 veces para barrer todo vapor previo del tubo interno, y 3) Colocá la campana graduada llena de agua.»`,
        [
          {
            label: st.bathBoiling ? '✓ 1° Baño en ebullición (100 °C)' : '🔥 1° Encender mechero y llevar baño de agua a ebullición (100 °C)',
            disabled: st.bathBoiling,
            onClick: () => {
              st.bathBoiling = true;
              window.AudioEngine.playFlame();
              runTP3Stage('preparacion');
            }
          },
          {
            label:
              st.purgeCount >= 3
                ? '✓ 2° Tubo interno purgado con aire seco (3/3)'
                : `💨 2° Insuflar aire seco en el tubo de vaporización (${st.purgeCount}/3 bombeos)`,
            disabled: !st.bathBoiling || st.purgeCount >= 3,
            onClick: () => {
              st.purgeCount++;
              if (st.purgeCount >= 3) st.tubePurged = true;
              window.AudioEngine.playBubble();
              runTP3Stage('preparacion');
            }
          },
          {
            label: '🧪 3° Ubicar campana colectora llena de agua y pasar a la pesada de la muestra',
            styleClass: 'rpg-btn-accent',
            disabled: !st.bathBoiling || !st.tubePurged,
            onClick: () => {
              st.bellPlaced = true;
              st.score += 15;
              window.AudioEngine.playSelect();
              runTP3Stage('pesada');
            }
          },
          {
            label: st.errors.oilBath147C
              ? '🛢️ Baño calefactor actual: Aceite a 147 °C en régimen (¡Comprobarás que NO da error!)'
              : '🛢️ Probar pregunta de parcial: Reemplazar agua (100 °C) por aceite (T_eb = 147 °C) en régimen',
            onClick: () => {
              st.errors.oilBath147C = !st.errors.oilBath147C;
              st.bathBoiling = true;
              window.AudioEngine.playFlame();
              runTP3Stage('preparacion');
            }
          },
          {
            label: '⚠️ Simular error: Pasar a pesar sin insuflar aire seco (quedan vapores previos)',
            styleClass: 'rpg-btn-warn',
            disabled: !st.bathBoiling,
            onClick: () => {
              st.errors.skipPurge = true;
              st.tubePurged = false;
              st.bellPlaced = true;
              runTP3Stage('pesada');
            }
          },
          {
            label: '🔄 Cambiar sustancia volátil problema',
            onClick: () => {
              const keys = Object.keys(window.TP3_VictorMeyer.SUBSTANCES);
              const nextKey = keys[(keys.indexOf(st.substanceKey) + 1) % keys.length];
              st.substanceKey = nextKey;
              st.sampleMassG = window.TP3_VictorMeyer.SUBSTANCES[nextKey].defaultMassG;
              runTP3Stage('preparacion');
            }
          }
        ],
        null
      );
    } else if (stageName === 'pesada') {
      st.ampouleWeighed = true;
      const mEmpty = st.emptyCapillaryMassG;
      const mFull = mEmpty + st.sampleMassG;

      const wbPesada = {
        title: 'DETERMINACIÓN GRAVIMÉTRICA DE LA MASA DE LÍQUIDO VOLÁTIL (m)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Masa microampolla vacía (m_vacía):</strong> ${mEmpty.toFixed(4)} g</span>
          <span><strong>Masa microampolla sellada con líquido (m_llena):</strong> ${mFull.toFixed(4)} g</span>
        `,
        fields: [
          {
            id: 'm_neta',
            label: 'Masa neta de líquido volátil en la ampollita (m)',
            formulaHint: 'm = m_llena - m_vacía',
            unit: 'g',
            targetValue: st.sampleMassG,
            decimals: 4,
            absTol: 0.001
          }
        ],
        onFieldSolved: () => {
          st.score += 10;
          updateHud();
        },
        onAllSolved: () => runTP3Stage('pesada')
      };

      const pesadaMsg = st.calcSolved.m_neta
        ? `«¡Excelente! Determinaste una masa neta m = ${st.sampleMassG.toFixed(4)} g de muestra volátil. Ahora hacé clic en el botón verde de abajo para llevar la ampollita al tubo de vaporización.»`
        : `«Pesamos en la balanza analítica la microampolla de vidrio vacía (${mEmpty.toFixed(4)} g) y luego de introducir el líquido volátil y cerrar el capilar a la llama volvemos a pesar (${mFull.toFixed(4)} g). Calculá la masa neta m de muestra en la Mesa de Cálculos de arriba.»`;

      showDialog(
        'jtp',
        pesadaMsg,
        [
          {
            label: st.calcSolved.m_neta
              ? '🧪 Llevar la ampollita pesada al tubo de vaporización'
              : '🧮 Ir a verificar la masa neta m en la Mesa de Cálculos para continuar',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              if (!st.calcSolved.m_neta) {
                const inp = document.getElementById('calc-in-m_neta');
                const fb = document.getElementById('calc-fb-m_neta');
                if (fb) {
                  fb.className = 'calc-feedback err';
                  fb.textContent = `👉 Ingresá ${mFull.toFixed(4)} - ${mEmpty.toFixed(4)} (= ${st.sampleMassG.toFixed(4)} g) y presioná "Verificar" (o "⚡ Resolver y Explicar Cálculos").`;
                }
                if (inp) {
                  inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  inp.focus();
                }
                return;
              }
              runTP3Stage('vaporizacion');
            }
          }
        ],
        wbPesada
      );
    } else if (stageName === 'vaporizacion') {
      const triggerVaporizationAnim = mode => {
        st.errors.slowStopperLoss = mode === 'slow_stopper';
        st.errors.ampouleStuckTop = mode === 'stuck_top';
        st.errors.notInThermalRegime = mode === 'not_regime';
        st.ampouleDropped = true;
        st.stopperClosedFast = mode !== 'slow_stopper';
        st.vaporizationDone = false;
        st.vaporizingAnim = true;
        st.animProgress = 0.0;
        // Reiniciar cálculos de la etapa final por si cambió la masa o el modo
        st.calcSolved.ph_mmhg = false;
        st.calcSolved.p_seco_atm = false;
        st.calcSolved.n_mmol = false;
        st.calcSolved.mw_exp = false;
        st.calcSolved.mult_n = false;

        window.TP3_VictorMeyer.computeCollectedVolume();
        window.TP3_VictorMeyer.performCalculations();

        let animMsg =
          '«Observá en el equipo y en la Lupa de la Campana cómo cae la ampollita hasta el fondo, se rompe sobre la lana de vidrio y el vapor desplaza un volumen igual de aire que burbujea haciendo descender el nivel de agua en la campana graduada...»';
        if (mode === 'stuck_top') {
          animMsg =
            '«⚠️ Mirá el tubo de vaporización: la ampollita quedó TRABADA en la parte superior (zona más fría) y no llegó al bulbo. Solo una fracción del líquido logra evaporarse, por lo que está entrando mucho menos aire a la campana (V menor → dará PM por EXCESO)...»';
        } else if (mode === 'not_regime') {
          animMsg =
            '«⚠️ Arrojaste la ampollita cuando el equipo AÚN NO ESTABA EN RÉGIMEN (temperatura en ascenso): además del vapor de la muestra, el aire caliente del bulbo sigue dilatándose y empuja volumen extra hacia la campana (V mayor → dará PM por DEFECTO)...»';
        } else if (mode === 'slow_stopper') {
          animMsg =
            '«⚠️ Demoraste en tapar (o el tapón pierde): parte del vapor escapa por la boca superior y se recoge menos volumen V en la campana (dará PM por EXCESO)...»';
        }

        showDialog('ayudante', animMsg, [], null);

        let clinkPlayed = false;
        const animTimer = setInterval(() => {
          st.animProgress += 0.025;
          if (!clinkPlayed && st.animProgress >= 0.25) {
            clinkPlayed = true;
            window.AudioEngine.playGlassClink();
          }
          if (st.animProgress > 0.25 && Math.round(st.animProgress * 40) % 4 === 0) {
            window.AudioEngine.playBubble();
          }
          if (st.animProgress >= 1.0) {
            clearInterval(animTimer);
            st.animProgress = 1.0;
            st.vaporizingAnim = false;
            st.vaporizationDone = true;
            if (mode === 'normal' && !st.bellOverflowed) st.score += 15;
            runTP3Stage('lectura');
          }
        }, 55);
      };

      showDialog(
        'jtp',
        '«Ahora retiramos el tapón superior, dejamos caer la ampollita para que se rompa sobre la lana de vidrio en el fondo y colocamos de inmediato el tapón. También podés simular acá mismo las situaciones experimentales que se toman en los parciales:»',
        [
          {
            label: '⚡ 1) Arrojar ampollita y tapar de inmediato en régimen (Procedimiento óptimo)',
            styleClass: 'rpg-btn-accent',
            disabled: st.vaporizingAnim,
            onClick: () => triggerVaporizationAnim('normal')
          },
          {
            label: '⚠️ 2) Simular Parcial: La ampollita queda trabada en la parte superior del tubo (PM por EXCESO)',
            styleClass: 'rpg-btn-warn',
            disabled: st.vaporizingAnim,
            onClick: () => triggerVaporizationAnim('stuck_top')
          },
          {
            label: '⚠️ 3) Simular Parcial: El equipo NO estaba en régimen (T en ascenso → PM por DEFECTO)',
            styleClass: 'rpg-btn-warn',
            disabled: st.vaporizingAnim,
            onClick: () => triggerVaporizationAnim('not_regime')
          },
          {
            label: '🐢 4) Simular Parcial: Demorar al tapar / pérdidas por el tapón (PM por EXCESO)',
            styleClass: 'rpg-btn-warn',
            disabled: st.vaporizingAnim,
            onClick: () => triggerVaporizationAnim('slow_stopper')
          },
          {
            label: '⚖️ Volver a la balanza para cambiar la masa (o probar desborde > 50 mL)',
            disabled: st.vaporizingAnim,
            onClick: () => runTP3Stage('pesada')
          }
        ],
        null
      );
    } else if (stageName === 'lectura') {
      const calc = window.TP3_VictorMeyer.performCalculations();
      if (st.bellOverflowed) {
        showDialog(
          'alerta',
          `«⚠️ ¡SE DESBORDÓ LA CAMPANA COLECTORA! Pesaste ${(st.sampleMassG * 1000).toFixed(0)} mg de ${sub.name}, que al vaporizarse desplazaron ${st.unclampedVolMl.toFixed(1)} mL de aire, superando la capacidad máxima de 50,0 mL de la campana. El exceso de gas (${(st.unclampedVolMl - 50.0).toFixed(1)} mL) escapó burbujeando al cristalizador y la campana quedó al tope (V = 50,0 mL, h = 0,0 cm). ¿Qué querés hacer?»`,
          [
            {
              label: '🔄 Volver a la balanza y pesar una masa menor (Procedimiento correcto: que V < 50 mL)',
              styleClass: 'rpg-btn-accent',
              onClick: () => runTP3Stage('pesada')
            },
            {
              label: `⚠️ Pasar igual a los cálculos tomando V = 50,0 mL (Ver cómo el exceso de masa infla el PM a ${calc.mwExp.toFixed(1)} g/mol)`,
              styleClass: 'rpg-btn-warn',
              onClick: () => runTP3Stage('calculos')
            }
          ],
          null
        );
      } else {
        showDialog(
          'jtp',
          `«¡Miralo en la Lupa de la Campana! El burbujeo cesó y el menisco de agua se estabilizó en V = ${st.collectedVolMl.toFixed(2)} mL, quedando una columna hidrostática de agua sin desalojar de altura h = ${st.waterColumnCm.toFixed(1)} cm (${(st.waterColumnCm * 10).toFixed(0)} mm H₂O). Ya podemos pasar a calcular el Peso Molecular.»`,
          [
            {
              label: `📏 Confirmar lectura (V = ${st.collectedVolMl.toFixed(2)} mL, h = ${st.waterColumnCm.toFixed(1)} cm) y abrir Mesa de Cálculos`,
              styleClass: 'rpg-btn-accent',
              onClick: () => runTP3Stage('calculos')
            },
            {
              label: '⚖️ Volver a la balanza (ej. para probar qué pasa si se pesa de más > 250 mg)',
              onClick: () => runTP3Stage('pesada')
            }
          ],
          null
        );
      }
    } else if (stageName === 'calculos') {
      const calc = window.TP3_VictorMeyer.performCalculations();
      const allVmSolved =
        st.calcSolved.ph_mmhg &&
        st.calcSolved.p_seco_atm &&
        st.calcSolved.n_mmol &&
        st.calcSolved.mw_exp &&
        st.calcSolved.mult_n;

      const wbVM = {
        title: `MESA DE CÁLCULOS DEL ESTUDIANTE — MÉTODO DE VÍCTOR MEYER (${sub.name})`,
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Masa muestra (m):</strong> ${st.sampleMassG.toFixed(4)} g</span>
          <span><strong>Volumen en campana (V):</strong> ${st.collectedVolMl.toFixed(2)} mL ${st.bellOverflowed ? '<strong style="color:#ff5964">(¡Desbordó!)</strong>' : ''}</span>
          <span><strong>Columna agua (h):</strong> ${st.waterColumnCm.toFixed(1)} cm (${(st.waterColumnCm * 10).toFixed(0)} mm H₂O)</span>
          <span><strong>T campana:</strong> ${st.tempAmbC.toFixed(1)} °C (${calc.T_K.toFixed(2)} K)</span>
          <span><strong>P_atm:</strong> ${st.patmMmHg.toFixed(1)} mmHg</span>
          <span><strong>P_v(H₂O):</strong> ${calc.pvUsedMmHg.toFixed(2)} mmHg</span>
          <span><strong>R:</strong> 0.08206 L·atm/(mol·K)</span>
        `,
        fields: [
          {
            id: 'ph_mmhg',
            label: '1. Presión de la columna de agua en mmHg (P_h)',
            formulaHint: 'P_h(mmHg) = h(mm H₂O) / 13.6   (con h = ' + (st.waterColumnCm * 10).toFixed(0) + ' mm)',
            unit: 'mmHg',
            targetValue: calc.phUsedMmHg,
            decimals: 2,
            absTol: 0.25
          },
          {
            id: 'p_seco_atm',
            label: '2. Presión parcial del aire seco en atmósferas (P_corr)',
            formulaHint: 'P_corr(atm) = (P_atm - P_v(H₂O) - P_h) / 760',
            unit: 'atm',
            targetValue: calc.pGasCorrAtm,
            decimals: 4,
            relTol: 0.01
          },
          {
            id: 'n_mmol',
            label: '3. Moles de gas desplazados expresados en milimoles (n)',
            formulaHint: 'n(mol) = (P_corr · V(L)) / (R · T)  →  multiplicá por 1000 para pasar a mmol',
            unit: 'mmol',
            targetValue: calc.molesCalc * 1000.0,
            decimals: 4,
            relTol: 0.02
          },
          {
            id: 'mw_exp',
            label: '4. Peso Molecular Experimental (M_exp)',
            formulaHint: 'M_exp = m(g) / n(mol)   (ó m(mg) / n(mmol))',
            unit: 'g/mol',
            targetValue: calc.mwExp,
            decimals: 2,
            relTol: 0.025
          },
          {
            id: 'mult_n',
            label: `5. Atomicidad n para la Fórmula Molecular: (${sub.empirical})_n`,
            formulaHint: `n = redondear(M_exp / M_fórmula_mínima) = M_exp / ${sub.empiricalMass.toFixed(2)}`,
            unit: 'entero',
            targetValue: calc.multRatio,
            decimals: 0,
            absTol: 0.2
          }
        ],
        onFieldSolved: () => {
          st.score += 8;
          updateHud();
        },
        onAllSolved: () => runTP3Stage('calculos')
      };

      let calcDialogMsg = '';
      if (allVmSolved) {
        calcDialogMsg = st.bellOverflowed
          ? `«Observá la consecuencia de haber pesado de más: como la campana solo retuvo 50,0 mL de los ${st.unclampedVolMl.toFixed(1)} mL reales, subestimaste los moles n y obtuviste un Peso Molecular aparente de ${calc.mwExp.toFixed(2)} g/mol (mucho mayor que el real de ${calc.mwTeo.toFixed(2)} g/mol, Error: +${calc.relErrPercent.toFixed(1)} %).»`
          : `«¡Muy buen trabajo! Con tus cálculos determinaste M_exp = ${calc.mwExp.toFixed(2)} g/mol (Teórico: ${calc.mwTeo.toFixed(2)} g/mol, Error: ${calc.relErrPercent.toFixed(2)} %) y hallaste la Fórmula Molecular ${calc.deducedFormula}.»`;
      } else {
        calcDialogMsg = st.bellOverflowed
          ? `«Como la campana desbordó, el máximo volumen que pudimos leer en la escala fue V = 50,00 mL (con h = 0,0 cm). Resolvé los 5 pasos en la Mesa de Cálculos (o tocá "⚡ Resolver y Explicar Cálculos") para comprobar cómo se distorsiona el Peso Molecular cuando se pesa muestra de más.»`
          : `«En la campana recogimos V = ${st.collectedVolMl.toFixed(2)} mL de aire saturado de vapor de agua con una columna hidrostática h = ${st.waterColumnCm.toFixed(1)} cm. Resolvé en tu Mesa de Cálculos las 5 etapas para hallar el Peso Molecular y la Fórmula Molecular.»`;
      }

      showDialog(
        'jtp',
        calcDialogMsg,
        [
          {
            label: '🎓 Responder pregunta conceptual de cierre (Problema 13 de la Guía)',
            styleClass: 'rpg-btn-accent',
            disabled: !allVmSolved,
            onClick: () => runTP3Stage('quiz')
          },
          {
            label: '⚠️ Probar en vivo los 7 Errores Experimentales de Parcial en Víctor Meyer',
            styleClass: 'rpg-btn-warn',
            onClick: () => {
              Object.keys(st.calcSolved).forEach(k => (st.calcSolved[k] = true));
              window.TP3_VictorMeyer.computeCollectedVolume();
              window.TP3_VictorMeyer.performCalculations();
              showDialog(
                'ayudante',
                '«Activá o desactivá cualquiera de las situaciones experimentales tomadas en los Segundos Parciales y observá en vivo en la Lupa de la Campana y en la Pizarra cómo varían V recogido, P_seco y el Peso Molecular calculado (por EXCESO, por DEFECTO o SIN ERROR):»',
                [
                  {
                    label: `${st.errors.ampouleStuckTop ? '✅' : '⬜'} 1) Ampollita trabada arriba en zona fría del tubo (-V → PM por EXCESO)`,
                    onClick: () => {
                      st.errors.ampouleStuckTop = !st.errors.ampouleStuckTop;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.notInThermalRegime ? '✅' : '⬜'} 2) Equipo fuera de régimen (T en ascenso dilata aire: +V → PM por DEFECTO)`,
                    onClick: () => {
                      st.errors.notInThermalRegime = !st.errors.notInThermalRegime;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.oilBath147C ? '✅' : '⬜'} 3) Reemplazar agua (100°C) por baño de aceite (147°C) en régimen (¡SIN ERROR!)`,
                    onClick: () => {
                      st.errors.oilBath147C = !st.errors.oilBath147C;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.skipPurge ? '✅' : '⬜'} 4) Insuflado previo insuficiente (vapor previo condensa: -V → PM por EXCESO)`,
                    onClick: () => {
                      st.errors.skipPurge = !st.errors.skipPurge;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.slowStopperLoss ? '✅' : '⬜'} 5) Pérdidas por el tapón o demorar al tapar (-V → PM por EXCESO)`,
                    onClick: () => {
                      st.errors.slowStopperLoss = !st.errors.slowStopperLoss;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.errors.ignorePvWater ? '✅' : '⬜'} 6) Olvidar restar P_v(H₂O) en el cálculo de P (+P → PM por DEFECTO)`,
                    onClick: () => {
                      st.errors.ignorePvWater = !st.errors.ignorePvWater;
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: `${st.bellOverflowed ? '✅' : '⬜'} 7) Pesar exceso de muestra (300 mg → desborda campana > 50 mL → PM por EXCESO)`,
                    onClick: () => {
                      st.sampleMassG = st.bellOverflowed ? sub.defaultMassG : 0.300;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  },
                  {
                    label: '✨ Restaurar corrida ideal sin errores y volver a los cálculos',
                    styleClass: 'rpg-btn-accent',
                    onClick: () => {
                      st.errors.ampouleStuckTop = false;
                      st.errors.notInThermalRegime = false;
                      st.errors.oilBath147C = false;
                      st.errors.skipPurge = false;
                      st.errors.slowStopperLoss = false;
                      st.errors.ignorePvWater = false;
                      st.errors.ignoreWaterColumn = false;
                      st.sampleMassG = sub.defaultMassG;
                      window.TP3_VictorMeyer.computeCollectedVolume();
                      window.TP3_VictorMeyer.performCalculations();
                      runTP3Stage('calculos');
                    }
                  }
                ],
                wbVM
              );
            }
          },
          {
            label: '⚖️ Volver a la balanza (Probar pesar de más o ajustar masa)',
            onClick: () => runTP3Stage('pesada')
          },
          {
            label: '📖 Abrir Bitácora y Exportar Informe (.TXT / .CSV)',
            onClick: () => toggleLogbook(true)
          },
          {
            label: '🔄 Reiniciar TP 3 con otra muestra',
            onClick: () => startTP3()
          }
        ],
        wbVM
      );
    } else if (stageName === 'quiz') {
      showDialog(
        'jtp',
        '«Pregunta de evaluación (Problema 13-b-iv de la Guía): ¿Qué ocurrirá con el valor del Peso Molecular calculado (M = m·R·T / (P·V)) si parte de la muestra se pierde en forma de vapor por demorar al tapar el tubo de vaporización luego de arrojar la ampollita?»',
        [
          {
            label: 'A) El Peso Molecular calculado será MAYOR que el real, porque se recoge un volumen V menor mientras se usa la masa original m en la cuenta',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.score = 100;
              window.AudioEngine.playFanfare();
              showDialog(
                'jtp',
                '«¡Impecable! Como el volumen V está en el denominador de M = m·R·T / (P·V), al perder vapor hacia el exterior recogemos un volumen V más chico en la campana, lo que subestima el número de moles n y produce un Peso Molecular aparente más alto que el verdadero.»',
                [
                  { label: '📖 Ver Bitácora y Exportar Informe (.TXT / .CSV)', styleClass: 'rpg-btn-accent', onClick: () => toggleLogbook(true) },
                  { label: '🏠 Volver a la Recepción para elegir otro TP', onClick: () => enterHub() }
                ],
                null
              );
            }
          },
          {
            label: 'B) El Peso Molecular calculado será MENOR que el real, porque quedó menos masa en el equipo',
            onClick: () => {
              window.AudioEngine.playError();
              showDialog(
                'ayudante',
                '«Recordá que en la fórmula M = m / n vos introducís el valor de masa m que pesaste en la balanza antes de arrojar la ampolla, pero el número de moles recogidos n = PV/(RT) disminuye porque mediste un volumen V menor.»',
                [{ label: 'Reintentar la pregunta', onClick: () => runTP3Stage('quiz') }],
                null
              );
            }
          }
        ],
        null
      );
    }
  }

  // =========================================================================
  // FLUJO INTERACTIVO Y CÁLCULOS DEL TP 4: CALORIMETRÍA — CALOR DE NEUTRALIZACIÓN
  // =========================================================================
  function startTP4() {
    app.activeTp = 'tp4';
    window.TP4_Calorimetria.reset();
    runTP4Stage('equivalente_agua');
  }

  function runTP4Stage(stageName) {
    const st = window.TP4_Calorimetria.getState();
    st.stage = stageName;

    if (stageName === 'equivalente_agua') {
      if (!st.equivDone) {
        showDialog(
          'jtp',
          '«En el TP 4 determinaremos el Calor de Neutralización. Primero necesitamos calibrar el Equivalente en Agua del calorímetro (E, Parte C de la Guía): colocamos m₁ = 60,0 g de agua a temperatura ambiente (Ta = 20,50 °C) en el termo, agregamos m₂ = 60,0 g de agua a 100,0 °C, agitamos y medimos la temperatura final de equilibrio Tf.»',
          [
            {
              label: '🌡️ Agregar los 60,0 g de agua a 100,0 °C, agitar y leer Tf en el termómetro',
              styleClass: 'rpg-btn-accent',
              onClick: () => {
                window.TP4_Calorimetria.computeEquivExperiment();
                window.AudioEngine.playRecordPoint();
                runTP4Stage('equivalente_agua');
              }
            }
          ],
          null
        );
      } else {
        const wbEquiv = {
          title: 'CÁLCULO DEL EQUIVALENTE EN AGUA DEL CALORÍMETRO (E) — Guía pág. 56',
          showAutoSolve: true,
          solvedMap: st.calcSolved,
          dataStripHtml: `
            <span><strong>Agua fría (m₁):</strong> ${st.m1ColdWaterG.toFixed(1)} g a Ta = ${st.t1ColdWaterC.toFixed(2)} °C</span>
            <span><strong>Agua caliente (m₂):</strong> ${st.m2HotWaterG.toFixed(1)} g a Tc = 100.0 °C</span>
            <span><strong>Temp. equilibrio (Tf):</strong> ${st.tfEquivC.toFixed(2)} °C</span>
            <span><strong>c_agua:</strong> 1.00 cal/(g·°C)</span>
          `,
          fields: [
            {
              id: 'equiv_e',
              label: 'Equivalente en agua del calorímetro (E)',
              formulaHint: 'De 0 = (m₁ + E)(Tf - Ta) + m₂(Tf - 100)  →  E = [m₂(100 - Tf) - m₁(Tf - Ta)] / (Tf - Ta)',
              unit: 'cal/°C',
              targetValue: st.calcWaterEquivE,
              decimals: 2,
              absTol: 0.35
            }
          ],
          onFieldSolved: () => {
            st.score += 15;
            updateHud();
          },
          onAllSolved: () => runTP4Stage('equivalente_agua')
        };

        showDialog(
          'ayudante',
          `«Leímos una temperatura final de equilibrio Tf = ${st.tfEquivC.toFixed(2)} °C. Planteá el balance adiabático 0 = E(Tf - Ta) + m₁·c·(Tf - Ta) + m₂·c·(Tf - 100) en tu Mesa de Cálculos y despejá el valor de E (en cal/°C).»`,
          [
            {
              label: '🧪 Confirmar E y pasar a la Etapa B: Marcha Calorimétrica de Neutralización',
              styleClass: 'rpg-btn-accent',
              disabled: !st.calcSolved.equiv_e,
              onClick: () => runTP4Stage('neutralizacion')
            }
          ],
          wbEquiv
        );
      }
    } else if (stageName === 'neutralizacion') {
      showDialog(
        'jtp',
        `«En la Etapa B colocamos en el termo 40,0 mL de NaOH 0,60 N + 100,0 mL de agua destilada, y en la ampolla de neutralización 10,00 mL de solución de ${st.acidType} 2,00 N (masa total de solución m_sol = 150,0 g). Hacé clic en la pera de goma (o en el botón) para insuflar el ácido y registrar la marcha calorimétrica.»`,
        [
          {
            label: '💨 Insuflar aire en la ampolla, agitar y registrar la curva T vs. tiempo',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.neutBaselineRecorded = true;
              st.neutAmpouleBlown = true;
              st.neutCurveDone = true;
              window.TP4_Calorimetria.generateNeutralizationCurve();
              window.AudioEngine.playBubble();
              runTP4Stage('marcha_grafica');
            }
          }
        ],
        null
      );
    } else if (stageName === 'marcha_grafica') {
      const wbMarcha = {
        title: 'DETERMINACIÓN GRÁFICA DE ΔT_total POR EL MÉTODO DE ÁREAS IGUALES (Guía pág. 54)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>Insuflación:</strong> t = 2.50 min</span>
          <span><strong>T₁ extrapolada (recta a):</strong> ${st.tInitialExtrapC.toFixed(3)} °C</span>
          <span><strong>T₂ extrapolada (recta b):</strong> ${st.tFinalExtrapC.toFixed(3)} °C</span>
        `,
        fields: [
          {
            id: 'dt_total',
            label: 'Salto térmico adiabático corregido (ΔT_total = T₂ - T₁)',
            formulaHint: `ΔT_total = ${st.tFinalExtrapC.toFixed(3)} - ${st.tInitialExtrapC.toFixed(3)}`,
            unit: '°C',
            targetValue: st.deltaTTotalC,
            decimals: 3,
            absTol: 0.015
          }
        ],
        onFieldSolved: () => {
          st.score += 10;
          updateHud();
        },
        onAllSolved: () => runTP4Stage('marcha_grafica')
      };

      showDialog(
        'jtp',
        '«En el gráfico proyectamos las rectas de deriva previa (a) y enfriamiento posterior (b) hasta la vertical c que iguala las áreas 1 y 2. A partir de las intersecciones T₁ y T₂, calculá el salto de temperatura ΔT_total = T₂ - T₁.»',
        [
          {
            label: '💧 Pasar a la Etapa C: Determinación del Calor de Dilución del ácido',
            styleClass: 'rpg-btn-accent',
            disabled: !st.calcSolved.dt_total,
            onClick: () => runTP4Stage('dilucion')
          }
        ],
        wbMarcha
      );
    } else if (stageName === 'dilucion') {
      showDialog(
        'ayudante',
        '«Para descontar el calor liberado por la simple dilución del ácido concentrado (10,00 mL de ácido 2,00 N), repetimos la experiencia reemplazando la solución de NaOH por agua destilada (140,0 mL de H₂O en el termo + 10,00 mL de ácido en la ampolla).»',
        [
          {
            label: '💨 Insuflar los 10,00 mL de ácido en el agua destilada y medir ΔT_dilución',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.dilDone = true;
              window.TP4_Calorimetria.performFinalCalculations();
              window.AudioEngine.playBubble();
              runTP4Stage('calculos');
            }
          }
        ],
        null
      );
    } else if (stageName === 'calculos') {
      const calc = window.TP4_Calorimetria.performFinalCalculations();
      const allCalSolved =
        st.calcSolved.q_total &&
        st.calcSolved.q_dil &&
        st.calcSolved.q_neut &&
        st.calcSolved.n_eq &&
        st.calcSolved.dh_neut;

      const wbCal = {
        title: 'MESA DE CÁLCULOS DEL ESTUDIANTE — ENTALPÍA DE NEUTRALIZACIÓN (Guía pág. 56)',
        showAutoSolve: true,
        solvedMap: st.calcSolved,
        dataStripHtml: `
          <span><strong>m_sol:</strong> ${calc.mSolG.toFixed(1)} g (c = 1 cal/g°C)</span>
          <span><strong>Equiv. E:</strong> ${calc.E_used.toFixed(2)} cal/°C</span>
          <span><strong>C_sistema (m_sol·c + E):</strong> ${calc.sysHeatCap.toFixed(2)} cal/°C</span>
          <span><strong>ΔT_total:</strong> +${st.deltaTTotalC.toFixed(3)} °C</span>
          <span><strong>ΔT_dilución:</strong> +${st.deltaTDilC.toFixed(3)} °C</span>
          <span><strong>Ácido:</strong> 10.00 mL de ${st.acidType} 2.00 N</span>
        `,
        fields: [
          {
            id: 'q_total',
            label: '1. Calor total de la reacción (Q_total)',
            formulaHint: 'De 0 = Q_t + (m_sol·1 + E)·ΔT_total  →  Q_t = -(m_sol + E)·ΔT_total  (¡Signo negativo por ser exotérmico!)',
            unit: 'cal',
            targetValue: calc.Q_total_cal,
            decimals: 2,
            relTol: 0.015
          },
          {
            id: 'q_dil',
            label: '2. Calor de dilución del ácido (Q_dilución)',
            formulaHint: 'Q_dil = -(m_sol·1 + E) · ΔT_dilución   (con signo negativo)',
            unit: 'cal',
            targetValue: calc.Q_dil_cal,
            decimals: 2,
            absTol: 0.25
          },
          {
            id: 'q_neut',
            label: '3. Calor neto de neutralización (Q_neutralización)',
            formulaHint: 'Q_neut = Q_total - Q_dilución',
            unit: 'cal',
            targetValue: calc.Q_neut_cal,
            decimals: 2,
            relTol: 0.015
          },
          {
            id: 'n_eq',
            label: '4. Número de equivalentes de ácido neutralizados (n_eq)',
            formulaHint: 'n_eq = V_ácido(L) × Normalidad = (10.00 / 1000) × 2.00',
            unit: 'eq',
            targetValue: calc.nEq,
            decimals: 4,
            absTol: 0.0005
          },
          {
            id: 'dh_neut',
            label: '5. Calor de neutralización por equivalente (ΔH_neut en kcal/eq)',
            formulaHint: 'ΔH(kcal/eq) = (Q_neut(cal) / 1000) / n_eq   (recordá pasar cal a kcal dividiendo por 1000)',
            unit: 'kcal/eq',
            targetValue: calc.dH_exp_kcal_eq,
            decimals: 2,
            relTol: 0.02
          }
        ],
        onFieldSolved: () => {
          st.score += 10;
          updateHud();
        },
        onAllSolved: () => runTP4Stage('calculos')
      };

      showDialog(
        'jtp',
        allCalSolved
          ? `«¡Excelente! Calculaste Q_total = ${calc.Q_total_cal.toFixed(1)} cal, descontaste Q_dilución = ${calc.Q_dil_cal.toFixed(1)} cal y hallaste ΔH_neutralización = ${calc.dH_exp_kcal_eq.toFixed(2)} kcal/eq frente al valor tabulado de -13,70 kcal/mol (Error: ${calc.relErrorPercent.toFixed(2)} %).»`
          : `«En la experiencia de dilución medimos ΔT_dilución = +${st.deltaTDilC.toFixed(3)} °C. Ahora resolvé en tu Mesa de Cálculos los 5 pasos del balance calorimétrico (cuidando los signos exotérmicos y el pasaje de cal a kcal) para determinar el ΔH de neutralización por equivalente.»`,
        [
          {
            label: '🎓 Responder pregunta conceptual de cierre (Problema 10 de la Guía)',
            styleClass: 'rpg-btn-accent',
            disabled: !allCalSolved,
            onClick: () => runTP4Stage('quiz')
          },
          {
            label: '📖 Abrir Bitácora y Exportar Informe (.TXT / .CSV)',
            onClick: () => toggleLogbook(true)
          },
          {
            label: '🔄 Reiniciar TP 4',
            onClick: () => startTP4()
          }
        ],
        wbCal
      );
    } else if (stageName === 'quiz') {
      showDialog(
        'jtp',
        '«Pregunta conceptual (Problema 10 de la Guía): ¿Cómo es la cantidad de calor liberada al neutralizar un equivalente de un ácido débil (como CH₃COOH) con NaOH respecto de la liberada al neutralizar igual cantidad de un ácido fuerte (HCl) con NaOH?»',
        [
          {
            label: 'A) Es MENOR en valor absoluto, porque parte de la energía se consume en producir la disociación endotérmica del ácido débil',
            styleClass: 'rpg-btn-accent',
            onClick: () => {
              st.score = 100;
              window.AudioEngine.playFanfare();
              showDialog(
                'jtp',
                '«¡Exacto! Mientras los ácidos y bases fuertes están totalmente ionizados en solución y su reacción neta es siempre H⁺(aq) + OH⁻(aq) → H₂O (ΔH° = -13,7 kcal/eq), un ácido débil está parcialmente ionizado y requiere absorber el calor de ionización a medida que se neutraliza.»',
                [
                  { label: '📖 Ver Bitácora y Exportar Informe (.TXT / .CSV)', styleClass: 'rpg-btn-accent', onClick: () => toggleLogbook(true) },
                  { label: '🏠 Volver a la Recepción para elegir otro TP', onClick: () => enterHub() }
                ],
                null
              );
            }
          },
          {
            label: 'B) Es exactamente igual (-13,7 kcal/eq) porque siempre se forma 1 mol de agua',
            onClick: () => {
              window.AudioEngine.playError();
              showDialog(
                'ayudante',
                '«Recordá la explicación de la página 55 de la guía: un ácido débil como el ácido acético o el HCN no está totalmente disociado inicialmente. Parte del calor liberado debe invertirse en disociar las moléculas del electrolito débil.»',
                [{ label: 'Reintentar la pregunta', onClick: () => runTP4Stage('quiz') }],
                null
              );
            }
          }
        ],
        null
      );
    }
  }

  // =========================================================================
  // BARRA DE CONTROLES INSTRUMENTALES CONTEXTUALES (SLIDERS Y AJUSTE FINO)
  // =========================================================================
  function renderInstrumentBar() {
    if (app.activeTp === 'tp1') {
      const st = window.TP1_Gases.getState();
      if (st.stage === 'fortin') {
        dom.instrumentBar.classList.remove('hidden');
        const existing = document.getElementById('sl-fortin');
        if (existing) {
          if (document.activeElement !== existing) existing.value = st.fortinScrewOffsetMm;
          document.getElementById('lbl-fortin').textContent = `${st.fortinScrewOffsetMm.toFixed(1)} mm`;
          return;
        }
        dom.instrumentBar.innerHTML = `
          <div class="inst-control-group">
            <span>🔧 Tornillo Cubeta Fortín (Enrase Punta de Marfil):</span>
            <input type="range" id="sl-fortin" class="inst-slider" min="-4.0" max="4.0" step="0.1" value="${st.fortinScrewOffsetMm}">
            <span class="inst-badge" id="lbl-fortin">${st.fortinScrewOffsetMm.toFixed(1)} mm</span>
          </div>
          <span class="skip-hint">Tip: Usá el slider, las teclas ← / → o hacé clic sobre el tornillo en el dibujo</span>
        `;
        document.getElementById('sl-fortin').addEventListener('input', e => {
          st.fortinScrewOffsetMm = parseFloat(e.target.value);
          document.getElementById('lbl-fortin').textContent = `${st.fortinScrewOffsetMm.toFixed(1)} mm`;
          window.AudioEngine.playDialTick(true);
        });
        document.getElementById('sl-fortin').addEventListener('change', e => {
          st.fortinScrewOffsetMm = parseFloat(e.target.value);
          runTP1Stage('fortin');
        });
        return;
      } else if (st.stage === 'boyle') {
        dom.instrumentBar.classList.remove('hidden');
        const existing = document.getElementById('sl-boyle');
        if (existing) {
          if (document.activeElement !== existing) existing.value = st.boyleBranchShiftCm;
          document.getElementById('lbl-boyle').textContent = `${st.boyleBranchShiftCm >= 0 ? '+' : ''}${st.boyleBranchShiftCm.toFixed(1)} cm Hg`;
          return;
        }
        dom.instrumentBar.innerHTML = `
          <div class="inst-control-group">
            <span>📏 Posición Rama Abierta (Δh = h_A - h_C):</span>
            <input type="range" id="sl-boyle" class="inst-slider" min="-16.0" max="24.0" step="0.5" value="${st.boyleBranchShiftCm}">
            <span class="inst-badge" id="lbl-boyle">${st.boyleBranchShiftCm >= 0 ? '+' : ''}${st.boyleBranchShiftCm.toFixed(1)} cm Hg</span>
          </div>
          <span class="skip-hint">Al cambiar la altura de la rama se actualizan L, h_A y h_C</span>
        `;
        document.getElementById('sl-boyle').addEventListener('change', e => {
          st.boyleBranchShiftCm = parseFloat(e.target.value);
          window.AudioEngine.playDialTick(false);
          runTP1Stage('boyle');
        });
        document.getElementById('sl-boyle').addEventListener('input', e => {
          st.boyleBranchShiftCm = parseFloat(e.target.value);
          document.getElementById('lbl-boyle').textContent = `${st.boyleBranchShiftCm >= 0 ? '+' : ''}${st.boyleBranchShiftCm.toFixed(1)} cm Hg`;
        });
        return;
      } else if (st.stage === 'gay_lussac') {
        dom.instrumentBar.classList.remove('hidden');
        const existingTemp = document.getElementById('sl-gl-temp');
        const existingDh = document.getElementById('sl-gl-dh');
        if (existingTemp && existingDh) {
          if (document.activeElement !== existingTemp) existingTemp.value = st.glBathTempC;
          if (document.activeElement !== existingDh) existingDh.value = st.glManometerAdjustMm;
          document.getElementById('lbl-gl-temp').textContent = `${st.glBathTempC.toFixed(1)} °C`;
          document.getElementById('lbl-gl-dh').textContent = `+${st.glManometerAdjustMm.toFixed(1)} mmHg`;
          return;
        }
        dom.instrumentBar.innerHTML = `
          <div class="inst-control-group">
            <span>🌡️ Temp. Baño (°C):</span>
            <input type="range" id="sl-gl-temp" class="inst-slider" min="20" max="85" step="1" value="${st.glBathTempC}">
            <span class="inst-badge" id="lbl-gl-temp">${st.glBathTempC.toFixed(1)} °C</span>
          </div>
          <div class="inst-control-group">
            <span>⚖️ Nivelación Manómetro (Δh):</span>
            <input type="range" id="sl-gl-dh" class="inst-slider" min="0" max="200" step="0.5" value="${st.glManometerAdjustMm}">
            <span class="inst-badge" id="lbl-gl-dh">+${st.glManometerAdjustMm.toFixed(1)} mmHg</span>
          </div>
        `;
        document.getElementById('sl-gl-temp').addEventListener('input', e => {
          st.glBathTempC = parseFloat(e.target.value);
          document.getElementById('lbl-gl-temp').textContent = `${st.glBathTempC.toFixed(1)} °C`;
        });
        document.getElementById('sl-gl-temp').addEventListener('change', e => {
          st.glBathTempC = parseFloat(e.target.value);
          runTP1Stage('gay_lussac');
        });
        document.getElementById('sl-gl-dh').addEventListener('input', e => {
          st.glManometerAdjustMm = parseFloat(e.target.value);
          document.getElementById('lbl-gl-dh').textContent = `+${st.glManometerAdjustMm.toFixed(1)} mmHg`;
          window.AudioEngine.playDialTick(true);
        });
        document.getElementById('sl-gl-dh').addEventListener('change', e => {
          st.glManometerAdjustMm = parseFloat(e.target.value);
          runTP1Stage('gay_lussac');
        });
        return;
      }
    } else if (app.activeTp === 'tp3') {
      const st = window.TP3_VictorMeyer.getState();
      if (st.stage === 'pesada') {
        dom.instrumentBar.classList.remove('hidden');
        const existing = document.getElementById('sl-vm-mass');
        if (existing) {
          if (document.activeElement !== existing) existing.value = st.sampleMassG;
          document.getElementById('lbl-vm-mass').textContent = `${(st.sampleMassG * 1000).toFixed(0)} mg`;
          return;
        }
        dom.instrumentBar.innerHTML = `
          <div class="inst-control-group">
            <span>⚖️ Masa de líquido en microampolla:</span>
            <input type="range" id="sl-vm-mass" class="inst-slider" min="0.050" max="0.360" step="0.002" value="${st.sampleMassG}">
            <span class="inst-badge" id="lbl-vm-mass">${(st.sampleMassG * 1000).toFixed(0)} mg</span>
            <button type="button" class="teacher-mini-btn" id="btn-vm-opt">✓ Masa óptima</button>
            <button type="button" class="teacher-mini-btn" id="btn-vm-over" style="border-color:#ff5964;color:#ff5964;">⚠️ Pesar de más (300 mg)</button>
          </div>
        `;
        document.getElementById('sl-vm-mass').addEventListener('input', e => {
          st.sampleMassG = parseFloat(e.target.value);
          document.getElementById('lbl-vm-mass').textContent = `${(st.sampleMassG * 1000).toFixed(0)} mg`;
          window.AudioEngine.playDialTick(true);
        });
        document.getElementById('sl-vm-mass').addEventListener('change', e => {
          st.sampleMassG = parseFloat(e.target.value);
          runTP3Stage('pesada');
        });
        document.getElementById('btn-vm-opt').addEventListener('click', () => {
          const sub = window.TP3_VictorMeyer.getCurrentSubstance();
          st.sampleMassG = sub.defaultMassG;
          document.getElementById('sl-vm-mass').value = st.sampleMassG;
          document.getElementById('lbl-vm-mass').textContent = `${(st.sampleMassG * 1000).toFixed(0)} mg`;
          window.AudioEngine.playSelect();
          runTP3Stage('pesada');
        });
        document.getElementById('btn-vm-over').addEventListener('click', () => {
          st.sampleMassG = 0.300;
          document.getElementById('sl-vm-mass').value = st.sampleMassG;
          document.getElementById('lbl-vm-mass').textContent = '300 mg';
          window.AudioEngine.playSelect();
          runTP3Stage('pesada');
        });
        return;
      }
    } else if (app.activeTp === 'tp4') {
      const st = window.TP4_Calorimetria.getState();
      if (st.stage === 'marcha_grafica') {
        dom.instrumentBar.classList.remove('hidden');
        const existing = document.getElementById('sl-cal-line');
        if (existing) {
          if (document.activeElement !== existing) existing.value = st.equalAreaLineMin;
          document.getElementById('lbl-cal-line').textContent = `t = ${st.equalAreaLineMin.toFixed(2)} min`;
          return;
        }
        dom.instrumentBar.innerHTML = `
          <div class="inst-control-group">
            <span>📐 Posición Recta Vertical c (Igualación de Áreas 1 y 2):</span>
            <input type="range" id="sl-cal-line" class="inst-slider" min="2.0" max="3.4" step="0.05" value="${st.equalAreaLineMin}">
            <span class="inst-badge" id="lbl-cal-line">t = ${st.equalAreaLineMin.toFixed(2)} min</span>
          </div>
        `;
        document.getElementById('sl-cal-line').addEventListener('input', e => {
          st.equalAreaLineMin = parseFloat(e.target.value);
          document.getElementById('lbl-cal-line').textContent = `t = ${st.equalAreaLineMin.toFixed(2)} min`;
          window.AudioEngine.playDialTick(true);
        });
        return;
      }
    }

    dom.instrumentBar.innerHTML = '';
    dom.instrumentBar.classList.add('hidden');
  }

  // =========================================================================
  // PANEL DE MODO DOCENTE (SIMULACIÓN DE ERRORES Y SALTO DE ETAPAS)
  // =========================================================================
  function runSelfDiagnostics() {
    const results = [];
    try {
      // 1. Calculadora y diagnóstico de unidades
      const evalOk = Math.abs(window.LabCommon.safeEvalMath('(758 - 19.8) / 760') - 0.971315) < 0.001;
      const signDiag = window.LabCommon.diagnoseNumericAnswer('13.7', -13.7, 0.02, 0.05);
      const unitDiag = window.LabCommon.diagnoseNumericAnswer('1963.5', 1.9635, 0.02, 0.05);
      results.push({
        name: 'Motor Matemático y Diagnóstico de Unidades',
        ok: evalOk && !signDiag.ok && !unitDiag.ok,
        detail: 'Evaluador científico, detección de signo y factor ×1000 OK'
      });

      // 2. TP 1: Leyes de los Gases
      const st1 = window.TP1_Gases.getState();
      const eqBoyle = window.TP1_Gases.computeBoyleEquilibrium(st1);
      const glSample = window.TP1_Gases.generateIdealGayLussacSample();
      const regGL = window.LabCommon.linearRegression(glSample.map(r => ({ x: r.t_C, y: r.P_atm })));
      const tZero = -regGL.intercept / regGL.slope;
      results.push({
        name: 'TP 1 (Boyle, Gay-Lussac y Graham)',
        ok: eqBoyle.PV > 10 && Math.abs(tZero - (-273.15)) < 1.5,
        detail: `PV = ${eqBoyle.PV.toFixed(2)} atm·mL | Cero Abs. = ${tZero.toFixed(2)} °C`
      });

      // 3. TP 2: Densidad de Gases (CO₂)
      window.TP2_Densidad.reset();
      const st2 = window.TP2_Densidad.getState();
      st2.vacuumDone = true;
      window.TP2_Densidad.computeM0();
      st2.pressureEqualized180 = true;
      window.TP2_Densidad.computeM1();
      window.TP2_Densidad.computeM2();
      const c2 = window.TP2_Densidad.performFinalCalculations();
      results.push({
        name: 'TP 2 (Densidad CO₂ y Reducción a CNTP)',
        ok: Math.abs(c2.deltaCntpExpGL - 1.9635) < 0.01,
        detail: `δ_CNTP = ${c2.deltaCntpExpGL.toFixed(4)} g/L (Teórico: 1.9635 g/L)`
      });

      // 4. TP 3: Víctor Meyer (Normal y Desborde > 50 mL)
      window.TP3_VictorMeyer.reset();
      const st3 = window.TP3_VictorMeyer.getState();
      st3.sampleMassG = 0.158;
      window.TP3_VictorMeyer.computeCollectedVolume();
      const c3Norm = window.TP3_VictorMeyer.performCalculations();
      const normOk = !st3.bellOverflowed && Math.abs(c3Norm.mwExp - 119.38) < 0.5;

      st3.sampleMassG = 0.300;
      window.TP3_VictorMeyer.computeCollectedVolume();
      const c3Over = window.TP3_VictorMeyer.performCalculations();
      const overOk = st3.bellOverflowed && st3.collectedVolMl === 50.0 && c3Over.mwExp > 140;
      window.TP3_VictorMeyer.reset();

      results.push({
        name: 'TP 3 (Víctor Meyer + Simulación de Desborde > 50 mL)',
        ok: normOk && overOk,
        detail: `Normal (158 mg): PM=${c3Norm.mwExp.toFixed(1)} | Desborde (300 mg): V=50 mL, PM=${c3Over.mwExp.toFixed(1)}`
      });

      // 5. TP 4: Calorimetría
      window.TP4_Calorimetria.reset();
      window.TP4_Calorimetria.computeEquivExperiment();
      window.TP4_Calorimetria.generateNeutralizationCurve();
      const c4 = window.TP4_Calorimetria.performFinalCalculations();
      results.push({
        name: 'TP 4 (Equivalente E y ΔH Neutralización)',
        ok: Math.abs(c4.dH_exp_kcal_eq - (-13.7)) < 0.2,
        detail: `E = ${c4.E_used.toFixed(2)} cal/°C | ΔH_neut = ${c4.dH_exp_kcal_eq.toFixed(2)} kcal/eq`
      });
    } catch (err) {
      results.push({ name: 'Excepción durante el Autotest', ok: false, detail: String(err) });
    }
    return results;
  }

  function renderTeacherPanel() {
    if (!app.teacherMode) {
      dom.teacherPanel.classList.add('hidden');
      return;
    }
    dom.teacherPanel.classList.remove('hidden');

    if (app.activeTp === 'hub') {
      dom.teacherContent.innerHTML = `
        <div class="teacher-card">
          <h4>Acceso Rápido de Cátedra</h4>
          <p>En Modo Docente podés saltar instantáneamente a cualquier etapa de los 4 Trabajos Prácticos, autocompletar los cálculos del estudiante para proyectar en clase y activar errores experimentales específicos.</p>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" onclick="window.LabApp.startTP1()">Ir a TP 1 (Gases)</button>
            <button class="teacher-mini-btn" onclick="window.LabApp.startTP2()">Ir a TP 2 (Densidad)</button>
            <button class="teacher-mini-btn" onclick="window.LabApp.startTP3()">Ir a TP 3 (Víctor Meyer)</button>
            <button class="teacher-mini-btn" onclick="window.LabApp.startTP4()">Ir a TP 4 (Calorimetría)</button>
          </div>
        </div>
        <div class="teacher-card">
          <h4>🩺 Diagnóstico y Verificación Automática</h4>
          <p>Ejecutá una batería de pruebas automáticas sobre los modelos físicos, ecuaciones, desbordes y validadores de los 4 TPs:</p>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" id="btn-run-autotest" style="border-color:#06d6a0;color:#06d6a0;">🩺 Ejecutar Autotest Completo (4 TPs)</button>
          </div>
          <div id="autotest-output" style="margin-top:8px;font-size:0.78rem;line-height:1.45;"></div>
        </div>
      `;
      const btnTest = document.getElementById('btn-run-autotest');
      if (btnTest) {
        btnTest.onclick = () => {
          const res = runSelfDiagnostics();
          const out = document.getElementById('autotest-output');
          window.AudioEngine.playFanfare();
          out.innerHTML = res
            .map(
              r =>
                `<div style="color:${r.ok ? '#06d6a0' : '#ff5964'};margin-bottom:3px;">${r.ok ? '✅' : '❌'} <strong>${r.name}:</strong> ${r.detail}</div>`
            )
            .join('');
        };
      }
      return;
    }

    if (app.activeTp === 'tp1') {
      const st = window.TP1_Gases.getState();
      dom.teacherContent.innerHTML = `
        <div class="teacher-card">
          <h4>Variables Ambientales</h4>
          <div class="teacher-row">
            <span>P_atm (mmHg):</span>
            <input type="number" id="tc-tp1-patm" class="teacher-input" step="0.5" value="${st.patmMmHg}">
          </div>
          <div class="teacher-row">
            <span>T_ambiente (°C):</span>
            <input type="number" id="tc-tp1-temp" class="teacher-input" step="0.5" value="${st.tempAmbC}">
          </div>
        </div>
        <div class="teacher-card">
          <h4>Salto Directo entre Experiencias</h4>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" id="tc-tp1-s1">Barómetro Fortín</button>
            <button class="teacher-mini-btn" id="tc-tp1-s2">Exp 1: Boyle</button>
            <button class="teacher-mini-btn" id="tc-tp1-s3">Gráficos Boyle</button>
            <button class="teacher-mini-btn" id="tc-tp1-s4">Exp 2: Gay-Lussac</button>
            <button class="teacher-mini-btn" id="tc-tp1-s5">Gráfico Cero Abs.</button>
            <button class="teacher-mini-btn" id="tc-tp1-s6">Exp 3: Graham</button>
          </div>
        </div>
      `;
      document.getElementById('tc-tp1-patm').onchange = e => {
        st.patmMmHg = parseFloat(e.target.value) || 758;
        runTP1Stage(st.stage);
      };
      document.getElementById('tc-tp1-temp').onchange = e => {
        st.tempAmbC = parseFloat(e.target.value) || 22;
        runTP1Stage(st.stage);
      };
      document.getElementById('tc-tp1-s1').onclick = () => runTP1Stage('fortin');
      document.getElementById('tc-tp1-s2').onclick = () => runTP1Stage('boyle');
      document.getElementById('tc-tp1-s3').onclick = () => {
        if (st.boyleRows.length === 0) st.boyleRows = window.TP1_Gases.generateIdealBoyleSample();
        runTP1Stage('boyle_graphs');
      };
      document.getElementById('tc-tp1-s4').onclick = () => runTP1Stage('gay_lussac');
      document.getElementById('tc-tp1-s5').onclick = () => {
        if (st.glRows.length === 0) st.glRows = window.TP1_Gases.generateIdealGayLussacSample();
        runTP1Stage('gl_graph');
      };
      document.getElementById('tc-tp1-s6').onclick = () => {
        st.grahamRingFormed = true;
        st.grahamMeasured = true;
        st.grahamProgress = 1.0;
        runTP1Stage('graham');
      };
    } else if (app.activeTp === 'tp2') {
      const st = window.TP2_Densidad.getState();
      dom.teacherContent.innerHTML = `
        <div class="teacher-card">
          <h4>Condiciones y Vacío</h4>
          <div class="teacher-row">
            <span>T_amb (°C):</span>
            <input type="number" id="tc-tp2-tamb" class="teacher-input" step="0.5" value="${st.tempAmbC}">
          </div>
          <div class="teacher-row">
            <span>P_atm (torr):</span>
            <input type="number" id="tc-tp2-patm" class="teacher-input" step="1" value="${st.patmTorr}">
          </div>
          <div class="teacher-row">
            <span>P residual vacío (cmHg):</span>
            <input type="number" id="tc-tp2-pres" class="teacher-input" step="0.2" min="0" max="10" value="${st.errors.residualPressureCmHg}">
          </div>
        </div>
        <div class="teacher-card">
          <h4>Errores en Tren de Lavado y Llave</h4>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp2-err-180" ${st.errors.skipEqualize180 ? 'checked' : ''}> No equilibrar llave 180° (Sobrepresión Kipp)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp2-err-f1" ${st.errors.missingWaterFlask ? 'checked' : ''}> Omitir Frasco 1: H₂O (Pasa HCl gaseoso)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp2-err-f2" ${st.errors.missingH2SO4Flask ? 'checked' : ''}> Omitir Frasco 2: H₂SO₄ (Pasa vapor H₂O)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp2-err-f3" ${st.errors.missingSilicaFlask ? 'checked' : ''}> Omitir Frasco 3: Sílica Gel (Trazas H₂O)</label>
          </div>
        </div>
        <div class="teacher-card">
          <h4>Errores en Agua y Salto Directo</h4>
          <div class="teacher-row">
            <span>Burbujas en m₂ (mL):</span>
            <input type="number" id="tc-tp2-bub" class="teacher-input" step="0.5" min="0" max="25" value="${st.errors.airBubblesWaterMl}">
          </div>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" id="tc-tp2-calc">Ir a Cálculos y Revelar Todo</button>
            <button class="teacher-mini-btn" id="tc-tp2-clean">Modo Perfecto (Sin Errores)</button>
          </div>
        </div>
      `;
      const recalcIfNeeded = () => {
        window.TP2_Densidad.performFinalCalculations();
        if (st.stage === 'calculos') runTP2Stage('calculos');
        else updateHud();
      };
      document.getElementById('tc-tp2-tamb').onchange = e => { st.tempAmbC = parseFloat(e.target.value) || 22; recalcIfNeeded(); };
      document.getElementById('tc-tp2-patm').onchange = e => { st.patmTorr = parseFloat(e.target.value) || 758; recalcIfNeeded(); };
      document.getElementById('tc-tp2-pres').onchange = e => { st.errors.residualPressureCmHg = parseFloat(e.target.value) || 0; recalcIfNeeded(); };
      document.getElementById('tc-tp2-err-180').onchange = e => { st.errors.skipEqualize180 = e.target.checked; recalcIfNeeded(); };
      document.getElementById('tc-tp2-err-f1').onchange = e => { st.errors.missingWaterFlask = e.target.checked; recalcIfNeeded(); };
      document.getElementById('tc-tp2-err-f2').onchange = e => { st.errors.missingH2SO4Flask = e.target.checked; recalcIfNeeded(); };
      document.getElementById('tc-tp2-err-f3').onchange = e => { st.errors.missingSilicaFlask = e.target.checked; recalcIfNeeded(); };
      document.getElementById('tc-tp2-bub').onchange = e => { st.errors.airBubblesWaterMl = parseFloat(e.target.value) || 0; recalcIfNeeded(); };
      document.getElementById('tc-tp2-calc').onclick = () => {
        st.vacuumDone = true;
        st.m0Weighed = true;
        st.kippPurged = true;
        st.ampollaFilledCo2 = true;
        st.pressureEqualized180 = !st.errors.skipEqualize180;
        st.m1Weighed = true;
        st.waterFilled = true;
        st.m2Weighed = true;
        Object.keys(st.calcSolved).forEach(k => (st.calcSolved[k] = true));
        window.TP2_Densidad.performFinalCalculations();
        runTP2Stage('calculos');
      };
      document.getElementById('tc-tp2-clean').onclick = () => {
        st.errors.residualPressureCmHg = 0;
        st.errors.skipEqualize180 = false;
        st.errors.missingWaterFlask = false;
        st.errors.missingH2SO4Flask = false;
        st.errors.missingSilicaFlask = false;
        st.errors.unfilledWaterMl = 0;
        st.errors.airBubblesWaterMl = 0;
        st.pressureEqualized180 = true;
        recalcIfNeeded();
        renderTeacherPanel();
      };
    } else if (app.activeTp === 'tp3') {
      const st = window.TP3_VictorMeyer.getState();
      const subs = window.TP3_VictorMeyer.SUBSTANCES;
      const optsHtml = Object.keys(subs)
        .map(k => `<option value="${k}" ${st.substanceKey === k ? 'selected' : ''}>${subs[k].name} (${subs[k].formula})</option>`)
        .join('');

      dom.teacherContent.innerHTML = `
        <div class="teacher-card">
          <h4>Sustancia y Condiciones</h4>
          <div class="teacher-row">
            <span>Muestra:</span>
            <select id="tc-tp3-sub" class="teacher-select">${optsHtml}</select>
          </div>
          <div class="teacher-row">
            <span>T_ambiente (°C):</span>
            <input type="number" id="tc-tp3-temp" class="teacher-input" step="0.5" value="${st.tempAmbC}">
          </div>
          <div class="teacher-row">
            <span>P_atm (mmHg):</span>
            <input type="number" id="tc-tp3-patm" class="teacher-input" step="1" value="${st.patmMmHg}">
          </div>
        </div>
        <div class="teacher-card">
          <h4>Errores Experimentales (Problemas Guía)</h4>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp3-e1" ${st.errors.skipPurge ? 'checked' : ''}> Mal insuflado previo (Queda vapor previo)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp3-e2" ${st.errors.slowStopperLoss ? 'checked' : ''}> Demorar al tapar tubo (Pérdida de vapor)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp3-e3" ${st.errors.ignorePvWater ? 'checked' : ''}> Ignorar P_v del agua en el cálculo</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp3-e4" ${st.errors.ignoreWaterColumn ? 'checked' : ''}> Ignorar columna de agua h en el cálculo</label>
          </div>
        </div>
        <div class="teacher-card">
          <h4>Acciones Rápidas</h4>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" id="tc-tp3-run">Simular Corrida y Revelar Cálculos</button>
          </div>
        </div>
      `;
      const refreshVM = () => {
        window.TP3_VictorMeyer.computeCollectedVolume();
        window.TP3_VictorMeyer.performCalculations();
        if (st.stage === 'calculos') runTP3Stage('calculos');
        else updateHud();
      };
      document.getElementById('tc-tp3-sub').onchange = e => {
        st.substanceKey = e.target.value;
        st.sampleMassG = subs[st.substanceKey].defaultMassG;
        refreshVM();
      };
      document.getElementById('tc-tp3-temp').onchange = e => { st.tempAmbC = parseFloat(e.target.value) || 22; refreshVM(); };
      document.getElementById('tc-tp3-patm').onchange = e => { st.patmMmHg = parseFloat(e.target.value) || 758; refreshVM(); };
      document.getElementById('tc-tp3-e1').onchange = e => { st.errors.skipPurge = e.target.checked; refreshVM(); };
      document.getElementById('tc-tp3-e2').onchange = e => { st.errors.slowStopperLoss = e.target.checked; refreshVM(); };
      document.getElementById('tc-tp3-e3').onchange = e => { st.errors.ignorePvWater = e.target.checked; refreshVM(); };
      document.getElementById('tc-tp3-e4').onchange = e => { st.errors.ignoreWaterColumn = e.target.checked; refreshVM(); };
      document.getElementById('tc-tp3-run').onclick = () => {
        st.bathBoiling = true;
        st.tubePurged = !st.errors.skipPurge;
        st.bellPlaced = true;
        st.ampouleWeighed = true;
        st.ampouleDropped = true;
        st.vaporizationDone = true;
        Object.keys(st.calcSolved).forEach(k => (st.calcSolved[k] = true));
        window.TP3_VictorMeyer.computeCollectedVolume();
        window.TP3_VictorMeyer.performCalculations();
        runTP3Stage('calculos');
      };
    } else if (app.activeTp === 'tp4') {
      const st = window.TP4_Calorimetria.getState();
      dom.teacherContent.innerHTML = `
        <div class="teacher-card">
          <h4>Sistema Ácido-Base</h4>
          <div class="teacher-row">
            <span>Ácido en ampolla:</span>
            <select id="tc-tp4-acid" class="teacher-select">
              <option value="HCl" ${st.acidType === 'HCl' ? 'selected' : ''}>HCl 2.0 N (Ácido Fuerte)</option>
              <option value="CH3COOH" ${st.acidType === 'CH3COOH' ? 'selected' : ''}>CH₃COOH 2.0 N (Ácido Débil)</option>
            </select>
          </div>
          <div class="teacher-row">
            <span>Equiv. E real (cal/°C):</span>
            <input type="number" id="tc-tp4-e" class="teacher-input" step="0.5" value="${st.realWaterEquivE}">
          </div>
        </div>
        <div class="teacher-card">
          <h4>Supuestos y Errores Calorimétricos</h4>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp4-err1" ${st.errors.nonAdiabaticLoss ? 'checked' : ''}> Termo no adiabático (Pérdidas al ambiente)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp4-err2" ${st.errors.ignoreDilution ? 'checked' : ''}> Despreciar calor de dilución (Q_dil = 0)</label>
          </div>
          <div class="teacher-row">
            <label><input type="checkbox" id="tc-tp4-err3" ${st.errors.ignoreWaterEquiv ? 'checked' : ''}> Despreciar equivalente del termo (E = 0)</label>
          </div>
        </div>
        <div class="teacher-card">
          <h4>Navegación de Etapas</h4>
          <div class="teacher-btn-bar">
            <button class="teacher-mini-btn" id="tc-tp4-s1">Etapa A (Equiv. E)</button>
            <button class="teacher-mini-btn" id="tc-tp4-s2">Gráfico Áreas Iguales</button>
            <button class="teacher-mini-btn" id="tc-tp4-s3">Ver Cálculos Resueltos</button>
          </div>
        </div>
      `;
      const refreshCal = () => {
        window.TP4_Calorimetria.computeEquivExperiment();
        window.TP4_Calorimetria.generateNeutralizationCurve();
        window.TP4_Calorimetria.performFinalCalculations();
        if (st.stage === 'calculos') runTP4Stage('calculos');
        else updateHud();
      };
      document.getElementById('tc-tp4-acid').onchange = e => { st.acidType = e.target.value; refreshCal(); };
      document.getElementById('tc-tp4-e').onchange = e => { st.realWaterEquivE = parseFloat(e.target.value) || 10.2; refreshCal(); };
      document.getElementById('tc-tp4-err1').onchange = e => { st.errors.nonAdiabaticLoss = e.target.checked; refreshCal(); };
      document.getElementById('tc-tp4-err2').onchange = e => { st.errors.ignoreDilution = e.target.checked; refreshCal(); };
      document.getElementById('tc-tp4-err3').onchange = e => { st.errors.ignoreWaterEquiv = e.target.checked; refreshCal(); };
      document.getElementById('tc-tp4-s1').onclick = () => runTP4Stage('equivalente_agua');
      document.getElementById('tc-tp4-s2').onclick = () => {
        refreshCal();
        st.neutAmpouleBlown = true;
        runTP4Stage('marcha_grafica');
      };
      document.getElementById('tc-tp4-s3').onclick = () => {
        refreshCal();
        st.neutAmpouleBlown = true;
        st.dilDone = true;
        Object.keys(st.calcSolved).forEach(k => (st.calcSolved[k] = true));
        runTP4Stage('calculos');
      };
    }
  }

  // =========================================================================
  // BITÁCORA DE LABORATORIO Y EXPORTACIÓN DE DATOS
  // =========================================================================
  function getCurrentLogbookData() {
    if (app.activeTp === 'tp1') return window.TP1_Gases.getLogbookData();
    if (app.activeTp === 'tp2') return window.TP2_Densidad.getLogbookData();
    if (app.activeTp === 'tp3') return window.TP3_VictorMeyer.getLogbookData();
    if (app.activeTp === 'tp4') return window.TP4_Calorimetria.getLogbookData();
    return {
      title: 'Resumen General — Cátedra de Introducción a la Química',
      metaHtml: 'Seleccioná uno de los 4 Trabajos Prácticos en la recepción para registrar y exportar sus tablas experimentales.',
      headers: ['TP #', 'Nombre del Trabajo Práctico', 'Capítulos de la Guía IQ 2019', 'Estado'],
      rows: [
        ['TP 1', 'Comportamiento y Leyes de los Gases', 'Páginas 36 a 39', 'Disponible'],
        ['TP 2', 'Densidad de Gases (CO₂ - Kipp y Regnault)', 'Páginas 40 a 43', 'Disponible'],
        ['TP 3', 'Determinación de Pesos Moleculares (Víctor Meyer)', 'Páginas 44 a 48', 'Disponible'],
        ['TP 4', 'Calorimetría — Calor de Neutralización', 'Páginas 52 a 57', 'Disponible']
      ]
    };
  }

  function toggleLogbook(forceState) {
    const isHidden = dom.logbookPanel.classList.contains('hidden');
    const show = forceState !== undefined ? forceState : isHidden;

    if (!show) {
      dom.logbookPanel.classList.add('hidden');
      return;
    }

    const data = getCurrentLogbookData();
    dom.logbookTitle.textContent = `📒 BITÁCORA DE LABORATORIO — ${data.title.toUpperCase()}`;
    dom.logbookSummary.innerHTML = data.metaHtml || '';

    dom.logbookHead.innerHTML = `<tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    if (data.rows.length === 0) {
      dom.logbookBody.innerHTML = `<tr><td colspan="${data.headers.length}">Todavía no se registraron determinaciones en esta sección.</td></tr>`;
    } else {
      dom.logbookBody.innerHTML = data.rows
        .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`)
        .join('');
    }

    dom.logbookPanel.classList.remove('hidden');
  }

  // =========================================================================
  // ENTRENADOR INTERACTIVO DE EJERCICIOS DE PARCIAL Y GUÍA (challenges.js)
  // =========================================================================
  const challengeSolvedMap = {};

  function openChallengesMenu(tpFilter) {
    if (!window.LabChallenges) return;
    const currentTp = tpFilter || (app.activeTp !== 'hub' ? app.activeTp : null);

    if (!currentTp) {
      showDialog(
        'jtp',
        '«Bienvenido al Entrenador de Ejercicios de Parcial y Cuestiones Experimentales (compilado de los 18 Segundos Parciales de Introducción a la Química y de la Guía de TP). Elegí de qué Trabajo Práctico querés resolver ejercicios numéricos y de análisis de errores:»',
        [
          {
            label: '1️⃣ Ejercicios de Parcial — TP 1: Leyes de Gases, Gráficos, Tubo de Boyle y Teoría Cinética (9 ejercicios)',
            styleClass: 'rpg-btn-hub',
            onClick: () => openChallengesMenu('tp1')
          },
          {
            label: '2️⃣ Ejercicios de Parcial — TP 2: Densidad de Gases, Estequiometría del Kipp y Errores (7 ejercicios)',
            styleClass: 'rpg-btn-hub',
            onClick: () => openChallengesMenu('tp2')
          },
          {
            label: '3️⃣ Ejercicios de Parcial — TP 3: Víctor Meyer, Fórmula Molecular y Análisis de Errores (7 ejercicios)',
            styleClass: 'rpg-btn-hub',
            onClick: () => openChallengesMenu('tp3')
          },
          {
            label: '4️⃣ Ejercicios de Parcial — TP 4: Calorimetría, Equivalente E, Reactivo Limitante y Dilución (5 ejercicios)',
            styleClass: 'rpg-btn-hub',
            onClick: () => openChallengesMenu('tp4')
          },
          {
            label: '↩ Volver a la Recepción de Trabajos Prácticos',
            onClick: () => enterHub()
          }
        ],
        null
      );
      return;
    }

    const list = window.LabChallenges.getChallengesForTp(currentTp);
    const tpNames = {
      tp1: 'TP 1: Leyes de los Gases, Gráficos y Teoría Cinética',
      tp2: 'TP 2: Densidad de Gases, Kipp y Regnault',
      tp3: 'TP 3: Pesos Moleculares por Víctor Meyer',
      tp4: 'TP 4: Calorimetría y Calor de Neutralización'
    };

    const opts = list.map((item, idx) => ({
      label: `📌 ${idx + 1}. ${item.title}`,
      onClick: () => runChallengeItem(currentTp, idx)
    }));

    opts.push({
      label: '📚 Elegir otra categoría de TP en el Entrenador de Parciales',
      styleClass: 'rpg-btn-accent',
      onClick: () => openChallengesMenu(null)
    });

    opts.push({
      label: '↩ Volver al laboratorio en curso',
      onClick: () => {
        if (app.activeTp === 'tp1') runTP1Stage(window.TP1_Gases.getState().stage);
        else if (app.activeTp === 'tp2') runTP2Stage(window.TP2_Densidad.getState().stage);
        else if (app.activeTp === 'tp3') runTP3Stage(window.TP3_VictorMeyer.getState().stage);
        else if (app.activeTp === 'tp4') runTP4Stage(window.TP4_Calorimetria.getState().stage);
        else enterHub();
      }
    });

    showDialog(
      'jtp',
      `«Seleccioná qué ejercicio de parcial o cuestión experimental de ${tpNames[currentTp] || currentTp} querés resolver en tu Mesa de Cálculos:»`,
      opts,
      null
    );
  }

  function runChallengeItem(tpKey, idx) {
    const list = window.LabChallenges.getChallengesForTp(tpKey);
    const item = list[idx];
    if (!item) return;

    let wbCfg = null;
    if (item.workbench) {
      wbCfg = {
        title: item.workbench.title,
        showAutoSolve: true,
        solvedMap: challengeSolvedMap,
        dataStripHtml: item.workbench.dataStripHtml,
        fields: item.workbench.fields,
        onFieldSolved: () => {
          window.AudioEngine.playRecordPoint();
        },
        onAllSolved: () => {
          window.AudioEngine.playFanfare();
        }
      };
    }

    const opts = [];
    if (Array.isArray(item.options)) {
      item.options.forEach(opt => {
        opts.push({
          label: opt.label,
          styleClass: opt.correct ? 'rpg-btn-accent' : '',
          onClick: () => {
            if (opt.correct) window.AudioEngine.playFanfare();
            else window.AudioEngine.playError();
            showDialog(
              opt.correct ? 'jtp' : 'ayudante',
              opt.feedback,
              [
                {
                  label: opt.correct ? '📋 Volver al listado de ejercicios de este TP' : '🔄 Reintentar pregunta',
                  styleClass: 'rpg-btn-accent',
                  onClick: () => (opt.correct ? openChallengesMenu(tpKey) : runChallengeItem(tpKey, idx))
                },
                {
                  label: '➡️ Siguiente ejercicio de la lista',
                  onClick: () => runChallengeItem(tpKey, (idx + 1) % list.length)
                }
              ],
              wbCfg
            );
          }
        });
      });
    }

    opts.push({
      label: '➡️ Pasar al siguiente ejercicio de este TP',
      styleClass: Array.isArray(item.options) ? '' : 'rpg-btn-accent',
      onClick: () => runChallengeItem(tpKey, (idx + 1) % list.length)
    });
    opts.push({
      label: '📋 Volver al listado de ejercicios de Parcial',
      onClick: () => openChallengesMenu(tpKey)
    });

    showDialog('jtp', item.prompt, opts, wbCfg);
  }

  // =========================================================================
  // INTERACCIÓN DIRECTA EN EL CANVAS, TECLADO Y BUCLE DE ANIMACIÓN
  // =========================================================================
  function bindEvents() {
    dom.btnHub.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      enterHub();
    });

    if (dom.btnChallenges) {
      dom.btnChallenges.addEventListener('click', () => {
        window.AudioEngine.playSelect();
        openChallengesMenu();
      });
    }

    dom.btnMode.addEventListener('click', () => {
      app.teacherMode = !app.teacherMode;
      window.AudioEngine.playSelect();
      updateHud();
      renderTeacherPanel();
    });

    dom.btnLogbook.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      toggleLogbook();
    });

    dom.btnCloseLog.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      toggleLogbook(false);
    });

    dom.btnExportTxt.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      const data = getCurrentLogbookData();
      data.modeLabel = app.teacherMode ? 'Modo Docente' : 'Modo Alumno';
      window.Exporter.exportReportTxt(app.activeTp, data);
    });

    dom.btnExportCsv.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      const data = getCurrentLogbookData();
      window.Exporter.exportReportCsv(app.activeTp, data);
    });

    dom.btnMute.addEventListener('click', () => {
      const muted = window.AudioEngine.toggleMute();
      dom.btnMute.textContent = muted ? '🔇 Audio OFF' : '🔊 Audio ON';
      dom.btnMute.classList.toggle('muted', muted);
    });

    document.querySelector('.dialog-box').addEventListener('click', () => {
      completeTypewriter();
    });

    // Interacción directa haciendo clic sobre los instrumentos en el Canvas
    dom.sceneCanvas.addEventListener('click', e => {
      const rect = dom.sceneCanvas.getBoundingClientRect();
      const scaleX = dom.sceneCanvas.width / rect.width;
      const scaleY = dom.sceneCanvas.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      if (app.activeTp === 'hub') {
        if (cy >= 48 && cy <= 225) {
          window.AudioEngine.playSelect();
          if (cx >= 24 && cx <= 192) startTP1();
          else if (cx >= 206 && cx <= 374) startTP2();
          else if (cx >= 388 && cx <= 556) startTP3();
          else if (cx >= 570 && cx <= 738) startTP4();
        }
      } else if (app.activeTp === 'tp1') {
        const st = window.TP1_Gases.getState();
        // Clic en el tornillo o lupa del Barómetro de Fortín para enrasar
        if (st.stage === 'fortin' && cx >= 130 && cx <= 470) {
          st.fortinScrewOffsetMm = 0.0;
          window.AudioEngine.playDialTick(true);
          runTP1Stage('fortin');
        }
      } else if (app.activeTp === 'tp2') {
        const st = window.TP2_Densidad.getState();
        // Clic en la Llave A de la ampolla de Regnault durante etapa de vacío
        if (st.stage === 'vacio' && cx >= 325 && cx <= 375 && cy >= 150 && cy <= 205) {
          st.valveAmpAOpen = !st.valveAmpAOpen;
          window.AudioEngine.playValve();
          runTP2Stage('vacio');
        }
      } else if (app.activeTp === 'tp4') {
        const st = window.TP4_Calorimetria.getState();
        // Clic en la pera de goma de insuflación del calorímetro
        if (st.stage === 'neutralizacion' && cx >= 155 && cx <= 205 && cy >= 30 && cy <= 80) {
          st.neutBaselineRecorded = true;
          st.neutAmpouleBlown = true;
          st.neutCurveDone = true;
          window.TP4_Calorimetria.generateNeutralizationCurve();
          window.AudioEngine.playBubble();
          runTP4Stage('marcha_grafica');
        }
      }
    });

    // Ajuste fino con flechas del teclado ← / → (cuando no se está escribiendo en un input)
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const dir = e.key === 'ArrowRight' ? 1 : -1;

      if (app.activeTp === 'tp1') {
        const st = window.TP1_Gases.getState();
        if (st.stage === 'fortin') {
          st.fortinScrewOffsetMm = Math.max(-4, Math.min(4, Number((st.fortinScrewOffsetMm + dir * 0.1).toFixed(1))));
          window.AudioEngine.playDialTick(true);
          runTP1Stage('fortin');
        } else if (st.stage === 'boyle') {
          st.boyleBranchShiftCm = Math.max(-16, Math.min(24, Number((st.boyleBranchShiftCm + dir * 0.5).toFixed(1))));
          window.AudioEngine.playDialTick(false);
          runTP1Stage('boyle');
        } else if (st.stage === 'gay_lussac') {
          st.glManometerAdjustMm = Math.max(0, Math.min(200, Number((st.glManometerAdjustMm + dir * 1.0).toFixed(1))));
          window.AudioEngine.playDialTick(true);
          runTP1Stage('gay_lussac');
        }
      }
    });
  }

  function mainLoop() {
    if (app.activeTp === 'hub') {
      renderHubScene(dom.sceneCanvas);
    } else if (app.activeTp === 'tp1') {
      window.TP1_Gases.renderScene(dom.sceneCanvas);
    } else if (app.activeTp === 'tp2') {
      window.TP2_Densidad.renderScene(dom.sceneCanvas);
    } else if (app.activeTp === 'tp3') {
      window.TP3_VictorMeyer.renderScene(dom.sceneCanvas);
    } else if (app.activeTp === 'tp4') {
      window.TP4_Calorimetria.renderScene(dom.sceneCanvas);
    }
    requestAnimationFrame(mainLoop);
  }

  function init() {
    cacheDom();
    bindEvents();
    enterHub();
    requestAnimationFrame(mainLoop);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    enterHub,
    startTP1,
    startTP2,
    startTP3,
    startTP4
  };
})();
