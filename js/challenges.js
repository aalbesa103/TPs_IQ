/**
 * challenges.js
 * Banco interactivo de Cuestiones Experimentales y Problemas Numéricos
 * extraídos directamente de la Guía de Trabajos Prácticos de Introducción a la Química (UNLP, Ed. 2019):
 * - TP 1 (Pág. 39): Problemas 2, 3, 4, 6, 7, 8, 10, 11 y 17
 * - TP 2 (Págs. 42-43): Preguntas 1 a 21 y Problemas 22, 23, 24 y 27
 * - TP 3 (Págs. 46-48): Preguntas 1 a 21 y Problemas 7, 9, 11 y 13
 * - TP 4 (Pág. 57): Termómetro de Beckmann y Problemas 1 a 12
 */

window.LabChallenges = (function () {
  const CHALLENGE_BANKS = {
    // =========================================================================
    // TP 1: COMPORTAMIENTO Y LEYES DE LOS GASES (Guía pág. 39)
    // =========================================================================
    tp1: [
      {
        id: 'tp1_p4',
        title: 'Problema 2 y 4 (Pág. 39): ¿Por qué usamos mercurio y no agua en el manómetro y barómetro?',
        type: 'conceptual_and_calc',
        prompt:
          '«En el Problema 4 de la Guía nos preguntan por qué trabajamos con mercurio (δ = 13,6 g/cm³) en lugar de agua (δ = 1,00 g/cm³). Primero calculá en la Mesa de Cálculos qué altura (en metros) tendría una columna de agua para equilibrar 1 atmósfera (76,0 cm de Hg), y luego elegí la justificación experimental completa.»',
        workbench: {
          title: 'PROBLEMA 2 y 3d (Pág. 39): ALTURA EQUIVALENTE DE UNA COLUMNA DE AGUA',
          dataStripHtml:
            '<span><strong>P_atm:</strong> 76,0 cm Hg (0,760 m Hg)</span><span><strong>δ(Hg):</strong> 13,6 g/cm³</span><span><strong>δ(H₂O):</strong> 1,00 g/cm³</span>',
          fields: [
            {
              id: 'p1_h_agua',
              label: 'Altura de una columna de agua que ejerce igual presión que 76,0 cm de Hg',
              formulaHint: 'Como P = δ·g·h  →  h_agua(m) = h_Hg(m) × (δ_Hg / δ_agua) = 0,760 × 13,6',
              unit: 'm H₂O',
              targetValue: 10.336,
              decimals: 2,
              relTol: 0.015
            }
          ]
        },
        options: [
          {
            label:
              'A) Porque gracias a su alta densidad (13,6 g/cm³) las columnas son manejables (~76 cm en vez de >10 m de agua), tiene bajísima presión de vapor y no moja el vidrio',
            correct: true,
            feedback:
              '«¡Exacto! Con agua necesitaríamos tubos de más de 10,3 metros de altura, además de que el agua saturaría el gas encerrado con vapor de agua (Pv ≈ 20 mmHg a temperatura ambiente) alterando su presión.»'
          },
          {
            label: 'B) Únicamente porque el mercurio es plateado y más fácil de ver a través del tubo de vidrio',
            correct: false,
            feedback:
              '«Si fuera solo por el color podríamos usar agua coloreada. Pensá en la altura de 10,34 m que acabás de calcular y en la presión de vapor del líquido.»'
          }
        ]
      },
      {
        id: 'tp1_p3',
        title: 'Problema 3 (Pág. 39): ¿Depende la presión manométrica del diámetro del tubo?',
        type: 'conceptual',
        prompt:
          '«En el Problema 3 se comparan dos cilindros verticales de mercurio de igual altura (h = 10,0 cm), pero uno tiene 2,0 cm de diámetro y el otro 2,8 cm de diámetro. ¿Cuál de los dos ejerce mayor presión sobre su base?»',
        options: [
          {
            label:
              'A) Ambos ejercen exactamente la misma presión (100 mmHg), porque la presión hidrostática P = F/A = (δ·g·A·h)/A = δ·g·h solo depende de la altura y la densidad, no de la sección del tubo',
            correct: true,
            feedback:
              '«¡Muy bien! Aunque el cilindro de 2,8 cm de diámetro pesa casi el doble, su peso se reparte sobre un área el doble de grande, por lo que la presión P = δ·g·h es idéntica.»'
          },
          {
            label: 'B) El cilindro de 2,8 cm de diámetro ejerce mayor presión porque contiene mayor masa de mercurio',
            correct: false,
            feedback:
              '«¡Cuidado con confundir Fuerza (peso) con Presión (Fuerza / Área)! Al dividir el peso m·g = δ·(π·r²·h)·g por el área de apoyo A = π·r², el radio r² se simplifica.»'
          }
        ]
      },
      {
        id: 'tp1_p7',
        title: 'Problema 7 (Pág. 39): Cálculo de Boyle-Mariotte en tubo cilíndrico',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 7 de la página 39: En una experiencia de Boyle se tiene un tubo cilíndrico de 0,50 cm de diámetro (radio r = 0,25 cm). Cuando Δh = +6,0 cm Hg (rama abierta más alta) y P_ext = 760 torr, la longitud de la columna de gas es L₁ = 15,0 cm. Calculá el volumen inicial V₁ y el volumen final V₂ cuando Δh se incremente a +13,0 cm Hg.»',
        workbench: {
          title: 'PROBLEMA 7 (Pág. 39): APLICACIÓN DE LA LEY DE BOYLE-MARIOTTE',
          dataStripHtml:
            '<span><strong>Diámetro:</strong> 0,50 cm (r = 0,25 cm)</span><span><strong>Estado 1:</strong> L₁ = 15,0 cm, Δh₁ = +60 mmHg</span><span><strong>Estado 2:</strong> Δh₂ = +130 mmHg</span><span><strong>P_ext:</strong> 760 torr</span>',
          fields: [
            {
              id: 'p1_prob7_v1',
              label: '1. Volumen inicial ocupado por el gas (V₁)',
              formulaHint: 'V₁ = π · r² · L₁ = 3,1416 × (0,25)² × 15,0',
              unit: 'cm³ (mL)',
              targetValue: Math.PI * 0.25 * 0.25 * 15.0,
              decimals: 3,
              relTol: 0.015
            },
            {
              id: 'p1_prob7_p1',
              label: '2. Presión inicial del gas (P₁ = P_ext + Δh₁)',
              formulaHint: 'P₁ = 760 + 60',
              unit: 'torr',
              targetValue: 820,
              decimals: 1,
              absTol: 1
            },
            {
              id: 'p1_prob7_p2',
              label: '3. Presión final del gas (P₂ = P_ext + Δh₂)',
              formulaHint: 'P₂ = 760 + 130',
              unit: 'torr',
              targetValue: 890,
              decimals: 1,
              absTol: 1
            },
            {
              id: 'p1_prob7_v2',
              label: '4. Volumen final ocupado por el gas (V₂)',
              formulaHint: 'Por Ley de Boyle: P₁ · V₁ = P₂ · V₂  →  V₂ = V₁ × (P₁ / P₂)',
              unit: 'cm³ (mL)',
              targetValue: Math.PI * 0.25 * 0.25 * 15.0 * (820.0 / 890.0),
              decimals: 3,
              relTol: 0.015
            }
          ]
        }
      },
      {
        id: 'tp1_p10',
        title: 'Problema 10 (Pág. 39): Precaución experimental al finalizar Gay-Lussac',
        type: 'conceptual',
        prompt:
          '«En el Problema 10 de la Guía se plantea una cuestión experimental fundamental de mesada: ¿Cómo deberías dejar la rama móvil del equipo de Charles y Gay-Lussac al terminar el TP si las mediciones se realizaron calentando hasta alta temperatura (80-90 °C)?»',
        options: [
          {
            label:
              'A) Hay que BAJAR la rama móvil abierta antes de que el baño se enfríe, porque al enfriarse el gas su presión cae y, si la rama móvil quedara alta, la presión atmosférica empujaría el mercurio dentro del bulbo de vidrio',
            correct: true,
            feedback:
              '«¡Excelente criterio experimental! Si dejáramos la rama abierta alta mientras el bulbo se enfría, el mercurio subiría por la rama fija y se volcaría dentro de la ampolla de gas, arruinando el equipo.»'
          },
          {
            label: 'B) Hay que subir la rama móvil al máximo para que no entre aire por el extremo abierto',
            correct: false,
            feedback:
              '«Pensá qué pasa cuando el gas dentro del bulbo se enfría de 85 °C a 20 °C: su presión disminuye considerablemente. Si la rama abierta está muy alta, ¿hacia dónde va a empujar la presión atmosférica a la columna de mercurio?»'
          }
        ]
      },
      {
        id: 'tp1_p11',
        title: 'Problema 11 (Pág. 39): Termómetro de gas a volumen constante (Gay-Lussac)',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 11 de la Guía: En una experiencia de Gay-Lussac hay una diferencia de 10,0 cm (100 mmHg) entre las ramas (siendo INFERIOR la altura de mercurio en la rama conectada al bulbo, por lo que P_gas > P_ext) cuando la temperatura es t₁ = 40,0 °C (313,15 K). Si la presión externa es 755 torr, calculá la presión del gas a 40 °C y a qué temperatura (en K y en °C) se igualarán los niveles en ambas ramas (Δh = 0, P₂ = 755 torr).»',
        workbench: {
          title: 'PROBLEMA 11 (Pág. 39): LEY DE GAY-LUSSAC A VOLUMEN CONSTANTE',
          dataStripHtml:
            '<span><strong>P_ext:</strong> 755 torr</span><span><strong>Δh₁:</strong> +100 torr (rama fija más baja)</span><span><strong>T₁:</strong> 40,0 °C = 313,15 K</span><span><strong>Estado 2 (niveles iguales):</strong> P₂ = 755 torr</span>',
          fields: [
            {
              id: 'p1_p11_p1',
              label: '1. Presión del gas a 40,0 °C (P₁)',
              formulaHint: 'Como el nivel en la rama del bulbo es inferior en 10 cm (100 torr): P₁ = P_ext + 100',
              unit: 'torr',
              targetValue: 855,
              decimals: 1,
              absTol: 1
            },
            {
              id: 'p1_p11_t2k',
              label: '2. Temperatura absoluta T₂ para igualar niveles (P₂ = 755 torr)',
              formulaHint: 'A V = cte: P₁ / T₁ = P₂ / T₂  →  T₂(K) = 313,15 × (755 / 855)',
              unit: 'K',
              targetValue: 313.15 * (755.0 / 855.0),
              decimals: 2,
              relTol: 0.01
            },
            {
              id: 'p1_p11_t2c',
              label: '3. Temperatura centígrada t₂ donde se igualan los niveles',
              formulaHint: 't₂(°C) = T₂(K) - 273,15',
              unit: '°C',
              targetValue: 313.15 * (755.0 / 855.0) - 273.15,
              decimals: 2,
              absTol: 0.5
            }
          ]
        }
      },
      {
        id: 'tp1_parcial_boyle_aire',
        title: 'Parcial 2026 (Inciso 3.1 PDF): Masa de aire encerrado en el tubo de Boyle-Mariotte',
        type: 'calc_only',
        prompt:
          '«Ejercicio de Segundo Parcial (2026): En una experiencia de Boyle-Mariotte similar a la del TP, el nivel de Hg en la rama abierta está 6,5 cm (65,0 mmHg) por encima del nivel de la rama cerrada; el diámetro interno del tubo cilíndrico que contiene el gas es d = 0,54 cm (radio r = 0,27 cm); la longitud de la columna de gas es h = 12,5 cm; la presión atmosférica es 761,4 torr y la temperatura del laboratorio es 16,5 °C (289,65 K). Calculá el volumen, el número de moles y la masa de aire encerrado (considerá 80% en moles de N₂ y 20% de O₂ → PM_aire = 28,8 g/mol).»',
        workbench: {
          title: 'PARCIAL 2026 (Inciso 3.1): TUBO DE BOYLE Y MASA DE AIRE (80% N₂ / 20% O₂)',
          dataStripHtml:
            '<span><strong>d:</strong> 0,54 cm (r = 0,27 cm)</span><span><strong>h_gas:</strong> 12,5 cm</span><span><strong>Δh:</strong> +65,0 torr</span><span><strong>P_atm:</strong> 761,4 torr</span><span><strong>T:</strong> 16,5 °C = 289,65 K</span><span><strong>PM_aire:</strong> 28,8 g/mol</span>',
          fields: [
            {
              id: 'p1_2026_v',
              label: '1. Volumen del cilindro de gas (V = π · r² · h)',
              formulaHint: 'V(mL) = 3,1416 × (0,27)² × 12,5',
              unit: 'mL (cm³)',
              targetValue: Math.PI * 0.27 * 0.27 * 12.5,
              decimals: 3,
              relTol: 0.015
            },
            {
              id: 'p1_2026_p',
              label: '2. Presión absoluta del aire encerrado en atmósferas (P_gas)',
              formulaHint: 'P_gas(atm) = (761,4 + 65,0) / 760',
              unit: 'atm',
              targetValue: (761.4 + 65.0) / 760.0,
              decimals: 4,
              relTol: 0.01
            },
            {
              id: 'p1_2026_n',
              label: '3. Moles de aire expresados en milimoles (n en mmol)',
              formulaHint: 'n(mmol) = [P_gas(atm) × V(mL)] / (0,08206 × 289,65)',
              unit: 'mmol',
              targetValue: (((761.4 + 65.0) / 760.0) * (Math.PI * 0.27 * 0.27 * 12.5)) / (0.08206 * 289.65),
              decimals: 4,
              relTol: 0.02
            },
            {
              id: 'p1_2026_m',
              label: '4. Masa de aire encerrada en miligramos (m en mg)',
              formulaHint: 'm(mg) = n(mmol) × 28,8 g/mol',
              unit: 'mg',
              targetValue:
                ((((761.4 + 65.0) / 760.0) * (Math.PI * 0.27 * 0.27 * 12.5)) / (0.08206 * 289.65)) * 28.8,
              decimals: 2,
              relTol: 0.02
            }
          ]
        }
      },
      {
        id: 'tp1_parcial_graficos',
        title: 'Parcial 2025 (Inciso 1.1 y 3.10 PDF): Modificación de gráficos P vs V, P vs 1/V y nivel de Hg en Gay-Lussac',
        type: 'conceptual',
        prompt:
          '«Pregunta clásica de Segundo Parcial (Incisos 1.1 y 3.10 del PDF): 1) Para una muestra de 0,0280 g de N₂ (PM=28, n=0,0010 mol) a 25 °C se grafican P vs V y P vs 1/V: ¿cómo cambian si se usan 0,0280 g de CO₂ (PM=44) o si se usan 0,0010 moles de CO₂ a 25 °C? 2) En el equipo de Gay-Lussac (V = cte), ¿qué ocurre con el nivel de Hg en la rama abierta si se reemplaza todo el aire del bulbo por igual masa de CO₂ vs. igual número de moles de CO₂?»',
        options: [
          {
            label:
              'A) Con igual MASA de CO₂ (PM 44 > 28) hay MENOS moles n: la hipérbola P vs V se acerca al origen, la pendiente de P vs 1/V disminuye y el nivel de Hg en la rama abierta de Gay-Lussac BAJA; en cambio, con igual NÚMERO DE MOLES de CO₂ (0,0010 mol) ningún gráfico ni nivel cambia',
            correct: true,
            feedback:
              '«¡Exacto! Las propiedades de un gas ideal dependen del número de moles n = m/PM y no de la naturaleza química del gas. A igual masa, como PM(CO₂)=44 > PM(N₂)=28, el número de moles disminuye; a igual número de moles, P, V y las gráficas permanecen idénticas.»'
          },
          {
            label:
              'B) Con CO₂ la presión y la pendiente siempre aumentan porque el CO₂ es una molécula más pesada que golpea más fuerte las paredes',
            correct: false,
            feedback:
              '«¡Cuidado! Según la Teoría Cinética, a igual temperatura T todos los gases tienen la misma energía cinética media por molécula (Ec = 3/2 kT). La presión depende de la concentración molar n/V, no de la masa individual de cada molécula.»'
          }
        ]
      },
      {
        id: 'tp1_parcial_charles_recta',
        title: 'Parcial 2024 (Inciso 1.4 PDF): Coeficiente de dilatación cúbica α y recta V vs t(°C)',
        type: 'calc_only',
        prompt:
          '«Ejercicio de Segundo Parcial (2024, Inciso 1.4 del PDF): La ecuación de la recta obtenida al representar el volumen de cierta masa de O₂ (PM = 32,0 g/mol) en función de la temperatura en °C a la presión constante de P = 1,00 atm es: V(L) = 0,546 + 0,00200 · t(°C). Sabiendo que V(t) = V₀ · (1 + α·t) = V₀ + (V₀·α)·t, obtené el volumen a 0 °C (V₀), el coeficiente de dilatación cúbica α (en °C⁻¹) y la masa de O₂ empleada.»',
        workbench: {
          title: 'PARCIAL 2024 (Inciso 1.4): RECTA DE CHARLES V(L) = 0,546 + 0,00200 · t(°C)',
          dataStripHtml:
            '<span><strong>Ordenada a 0 °C (V₀):</strong> 0,546 L</span><span><strong>Pendiente (V₀·α):</strong> 0,00200 L/°C</span><span><strong>P:</strong> 1,00 atm</span><span><strong>PM(O₂):</strong> 32,0 g/mol</span>',
          fields: [
            {
              id: 'p1_ch_v0',
              label: '1. Volumen del gas a 0 °C (V₀ = ordenada al origen)',
              formulaHint: 'Evaluá V(t) en t = 0 °C  →  V₀ = 0,546 L',
              unit: 'L',
              targetValue: 0.546,
              decimals: 3,
              absTol: 0.002
            },
            {
              id: 'p1_ch_alpha',
              label: '2. Coeficiente de dilatación cúbica (α = pendiente / V₀)',
              formulaHint: 'Como pendiente = V₀ · α = 0,00200  →  α = 0,00200 / 0,546 (≈ 1/273 °C⁻¹)',
              unit: '°C⁻¹',
              targetValue: 0.002 / 0.546,
              decimals: 5,
              relTol: 0.02
            },
            {
              id: 'p1_ch_mo2',
              label: '3. Masa de O₂ usada en la experiencia (a T₀ = 273,15 K y P = 1,00 atm)',
              formulaHint: 'm(O₂) = (P · V₀ / (0,08206 · 273,15)) × 32,0',
              unit: 'g',
              targetValue: ((1.0 * 0.546) / (0.08206 * 273.15)) * 32.0,
              decimals: 3,
              relTol: 0.02
            }
          ]
        }
      },
      {
        id: 'tp1_parcial_tcg',
        title: 'Parcial 2025/2026 (Sección 4 PDF): Teoría Cinética de los Gases y Ley de Graham',
        type: 'calc_only',
        prompt:
          '«Ejercicio de Segundo Parcial (Incisos 4.1 y 4.19 del PDF): 1) ¿Cuánto tiempo tardará el NO(g) (PM = 30,0 g/mol) en recorrer una distancia que el N₂O₅(g) (PM = 108,0 g/mol) recorre en 50,0 segundos a la misma temperatura? 2) Calculá para el O₂ (PM = 32,0 g/mol = 0,0320 kg/mol) a 25,0 °C (298,15 K) la energía cinética traslacional media por mol (en J/mol) y la velocidad cuadrática media u (en m/s), usando R = 8,314 J/(K·mol).»',
        workbench: {
          title: 'PARCIAL 2025/2026 (Sección 4): DIFUSIÓN DE GRAHAM Y TEORÍA CINÉTICA',
          dataStripHtml:
            '<span><strong>PM(NO):</strong> 30,0 g/mol</span><span><strong>PM(N₂O₅):</strong> 108,0 g/mol (t = 50,0 s)</span><span><strong>O₂ a 298,15 K:</strong> PM = 0,0320 kg/mol</span><span><strong>R:</strong> 8,314 J/(K·mol)</span>',
          fields: [
            {
              id: 'p1_tcg_tno',
              label: '1. Tiempo que tarda el NO(g) en recorrer igual distancia que el N₂O₅ (50,0 s)',
              formulaHint: 'A igual distancia: t_NO / t_N2O5 = √(PM_NO / PM_N2O5)  →  t_NO = 50,0 × √(30,0 / 108,0)',
              unit: 's',
              targetValue: 50.0 * Math.sqrt(30.0 / 108.0),
              decimals: 2,
              relTol: 0.02
            },
            {
              id: 'p1_tcg_ec',
              label: '2. Energía cinética media por mol a 298,15 K (Ec = 3/2 · R · T)',
              formulaHint: 'Ec_mol = 1,5 × 8,314 × 298,15',
              unit: 'J/mol',
              targetValue: 1.5 * 8.314 * 298.15,
              decimals: 1,
              relTol: 0.015
            },
            {
              id: 'p1_tcg_vel',
              label: '3. Velocidad cuadrática media de las moléculas de O₂ a 298,15 K',
              formulaHint: 'u = √(3 · R · T / PM_kg) = √(3 × 8,314 × 298,15 / 0,0320)   (¡PM en kg/mol!)',
              unit: 'm/s',
              targetValue: Math.sqrt((3.0 * 8.314 * 298.15) / 0.032),
              decimals: 1,
              relTol: 0.015
            }
          ]
        }
      }
    ],

    // =========================================================================
    // TP 2: DENSIDAD DE GASES — APARATO DE KIPP Y REGNAULT (Guía págs. 42-43)
    // =========================================================================
    tp2: [
      {
        id: 'tp2_q4_q9',
        title: 'Preguntas 4, 5 y 9 (Pág. 42): Orden de las pesadas y elección de balanzas',
        type: 'conceptual',
        prompt:
          '«En las Preguntas 4 y 9 de la página 42 se cuestionan dos aspectos claves del procedimiento: 1) ¿Por qué se mide primero la masa con CO₂ (m₁) y recién al final la masa con agua (m₂)? y 2) ¿Por qué m₀ y m₁ se pesan en balanza analítica (±0,0001 g, sin tocar la ampolla con las manos) mientras que m₂ se pesa en balanza granataria (±0,01 g)?»',
        options: [
          {
            label:
              'A) Porque si llenáramos primero con agua sería muy difícil secar totalmente la ampolla antes de evacuar; y porque m₁ - m₀ ≈ 0,9 g requiere precisión de 0,1 mg, mientras que m₂ ≈ 685 g supera la capacidad de la balanza analítica (200 g)',
            correct: true,
            feedback:
              '«¡Impecable! Una sola gota de agua remanente al hacer vacío se evaporaría dentro de la ampolla falseando m₀ y m₁. Y para m₂ - m₀ ≈ 500 g de agua, una balanza granataria (±0,01 g) da un error relativo de apenas 0,002%.»'
          },
          {
            label:
              'B) El orden es arbitrario, y se usan dos balanzas distintas solo para que todos los alumnos practiquen con ambos instrumentos',
            correct: false,
            feedback:
              '«Recordá que la balanza analítica de cadena tiene una carga máxima de 200 g (pág. 18 de la Guía). Si pusieras la ampolla llena de agua (~685 g) en la balanza analítica, la dañarías.»'
          }
        ]
      },
      {
        id: 'tp2_q6_q10',
        title: 'Preguntas 1, 6 y 10 (Pág. 42): Control de vacío y dinámica del burbujeo en el Kipp',
        type: 'conceptual',
        prompt:
          '«Analicemos las Preguntas 6 y 10 de la página 42: ¿Cómo verificás experimentalmente que la ampolla no "pierde vacío" antes de retirarla, y por qué al conectarla luego al Aparato de Kipp el burbujeo en los frascos lavadores es inicialmente muy violento y luego casi se detiene hasta abrir la segunda llave a la atmósfera?»',
        options: [
          {
            label:
              'A) Cerrando la llave hacia la bomba y verificando que las ramas del manómetro de Hg no se desnivelen; y al conectar al Kipp el burbujeo inicial es brusco porque la ampolla está en vacío (ΔP ≈ 1 atm) y se frena cuando su presión interna iguala a la del Kipp',
            correct: true,
            feedback:
              '«¡Exacto! Al principio el CO₂ irrumpe hacia la ampolla evacuada impulsado por casi 1 atm de diferencia de presión; una vez llena la ampolla cerrada, el flujo cesa hasta que abrimos la llave de salida a la atmósfera para purgar durante 10-15 minutos.»'
          },
          {
            label:
              'B) El burbujeo inicial es violento porque el ácido clorhídrico está caliente y luego se detiene porque se agota todo el mármol (CaCO₃) del Kipp',
            correct: false,
            feedback:
              '«El Kipp tiene abundante mármol en su bulbo intermedio. Pensá en la diferencia de presiones entre el tren purificador (~1 atm) y el interior de la ampolla recién evacuada (~0 atm).»'
          }
        ]
      },
      {
        id: 'tp2_q15_q20',
        title: 'Preguntas 13 a 20 (Pág. 42): Clasificación de errores sistemáticos (por exceso o por defecto)',
        type: 'conceptual',
        prompt:
          '«Compará las situaciones de las Preguntas 15, 16 y 20 de la Guía: (I) Al hacer vacío para medir m₀ queda aire residual que LUEGO ES DESPLAZADO por el CO₂; (II) Queda aire residual que NO ES DESPLAZADO por el CO₂; (III) Quedan burbujas de aire al llenar la ampolla con agua en m₂. ¿Qué tipo de error produce cada una sobre la densidad calculada del CO₂?»',
        options: [
          {
            label:
              'A) (I) Error por DEFECTO (m₀ resulta alta → m_gas = m₁ - m₀ baja); (II) Error por DEFECTO aún mayor (además de m₀ alta, entra menos CO₂ en m₁); (III) Error por EXCESO (subestima V_ampolla → δ = m/V sube)',
            correct: true,
            feedback:
              '«¡Brillante análisis de errores! En (I) y (II) m₀ está sobreestimada por el aire no evacuado, achicando el numerador m₁ - m₀; mientras que en (III) las burbujas en el agua achican el denominador V = (m₂ - m₀)/δ_agua, inflando la densidad.»'
          },
          {
            label:
              'B) Las tres situaciones producen error por exceso porque el aire y las burbujas suman volumen extra',
            correct: false,
            feedback:
              '«Miralo en la fórmula δ = (m₁ - m₀) / V: si queda aire al pesar m₀, entonces m₀ es más grande que la masa de vidrio vacío, por lo que la resta (m₁ - m₀) da MENOR que la masa real de CO₂.»'
          }
        ]
      },
      {
        id: 'tp2_p23',
        title: 'Problema 23 (Pág. 43): Masa de aire residual en un vacío incompleto',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 23 de la página 43: ¿Qué masa de aire (80% en moles de N₂, PM=28,0 g/mol y 20% de O₂, PM=32,0 g/mol) quedará en una ampolla de Regnault de 500 mL (0,500 L) cuando se hace un vacío incompleto a 25,0 °C (298,15 K) dejando una presión residual de 1,50 cm de mercurio (15,0 mmHg)?»',
        workbench: {
          title: 'PROBLEMA 23 (Pág. 43): MASA DE AIRE RESIDUAL EN LA AMPOLLA',
          dataStripHtml:
            '<span><strong>V:</strong> 0,500 L</span><span><strong>T:</strong> 25,0 °C = 298,15 K</span><span><strong>P_res:</strong> 1,50 cmHg = 15,0 mmHg</span><span><strong>Composición aire:</strong> 80% N₂ (28 g/mol) + 20% O₂ (32 g/mol)</span>',
          fields: [
            {
              id: 'p2_p23_pma',
              label: '1. Peso molecular promedio del aire (PM_aire)',
              formulaHint: 'PM_aire = 0,80 × 28,0 + 0,20 × 32,0',
              unit: 'g/mol',
              targetValue: 28.8,
              decimals: 2,
              absTol: 0.1
            },
            {
              id: 'p2_p23_patm',
              label: '2. Presión residual expresada en atmósferas (P_res)',
              formulaHint: 'P(atm) = 15,0 / 760',
              unit: 'atm',
              targetValue: 15.0 / 760.0,
              decimals: 5,
              relTol: 0.01
            },
            {
              id: 'p2_p23_m',
              label: '3. Masa de aire residual en la ampolla (m_aire)',
              formulaHint: 'm = (P · V · PM_aire) / (R · T)   con R = 0,08206 L·atm/(mol·K)',
              unit: 'g',
              targetValue: ((15.0 / 760.0) * 0.5 * 28.8) / (0.08206 * 298.15),
              decimals: 4,
              relTol: 0.02
            }
          ]
        }
      },
      {
        id: 'tp2_p27',
        title: 'Problema 27 (Pág. 43): Determinación del Peso Molecular de un gas incógnita',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 27 de la página 43: En una experiencia con la ampolla de Regnault se obtuvieron los siguientes datos: P_atm = 729,6 torr, t = 25,0 °C (298,15 K), m₀ (vacía) = 162,354 g, m₁ (con gas) = 163,071 g, m₂ (con agua) = 661,754 g, y δ_agua = 0,9988 g/mL. Calculá el volumen de la ampolla, la densidad del gas y su Peso Molecular (PM).»',
        workbench: {
          title: 'PROBLEMA 27 (Pág. 43): DENSIDAD Y PESO MOLECULAR POR EL MÉTODO DE REGNAULT',
          dataStripHtml:
            '<span><strong>P_atm:</strong> 729,6 torr (0,9600 atm)</span><span><strong>T:</strong> 298,15 K</span><span><strong>m₀:</strong> 162,354 g</span><span><strong>m₁:</strong> 163,071 g</span><span><strong>m₂:</strong> 661,754 g</span><span><strong>δ_agua:</strong> 0,9988 g/mL</span>',
          fields: [
            {
              id: 'p2_p27_v',
              label: '1. Volumen de la ampolla (V_ampolla)',
              formulaHint: 'V(mL) = (m₂ - m₀) / δ_agua = (661,754 - 162,354) / 0,9988',
              unit: 'mL',
              targetValue: (661.754 - 162.354) / 0.9988,
              decimals: 2,
              absTol: 0.3
            },
            {
              id: 'p2_p27_mgas',
              label: '2. Masa del gas encerrado (m_gas = m₁ - m₀)',
              formulaHint: 'm_gas = 163,071 - 162,354',
              unit: 'g',
              targetValue: 0.717,
              decimals: 3,
              absTol: 0.002
            },
            {
              id: 'p2_p27_d',
              label: '3. Densidad del gas a 25,0 °C y 729,6 torr (δ = m_gas / V(L))',
              formulaHint: 'δ(g/L) = m_gas(g) / V(L)   (dividí V en mL por 1000)',
              unit: 'g/L',
              targetValue: 0.717 / ((661.754 - 162.354) / 0.9988 / 1000.0),
              decimals: 4,
              relTol: 0.015
            },
            {
              id: 'p2_p27_pm',
              label: '4. Peso Molecular del gas (PM = δ · R · T / P)',
              formulaHint: 'PM = δ(g/L) × 0,08206 × 298,15 / (729,6 / 760)',
              unit: 'g/mol',
              targetValue:
                (0.717 / ((661.754 - 162.354) / 0.9988 / 1000.0)) *
                0.08206 *
                298.15 /
                (729.6 / 760.0),
              decimals: 2,
              relTol: 0.015
            }
          ]
        }
      },
      {
        id: 'tp2_parcial_kipp_esteq',
        title: 'Parcial 2024 (Inciso 5.2 PDF): Presión en el Kipp cerrado, estequiometría de CaCO₃/HCl y humedad residual',
        type: 'calc_only',
        prompt:
          '«Ejercicio integrador de Segundo Parcial (2024, Inciso 5.2 del PDF): (i) Un aparato de Kipp cerrado tiene una diferencia de niveles en la solución de HCl (12,0% p/p y densidad d = 1,07 g/mL) de h = 45,0 cm (450 mm) cuando P_atm = 757,7 torr (d_Hg = 13,6 g/mL). ¿Cuál es la presión del gas en el Kipp (en torr)? (ii) Se hacen reaccionar 3,26 g de una muestra 89,0% p/p en CaCO₃ (PM = 100 g/mol) con HCl en exceso y con el CO₂ producido se llena una ampolla a 757,7 torr y 22,3 °C (295,45 K). Calculá el volumen de la ampolla (en L). (iii) Si en la ampolla anterior queda un 10% en moles de vapor de agua (PM=18) y 90% de CO₂ (PM=44), ¿qué masa total de gas contiene la ampolla?»',
        workbench: {
          title: 'PARCIAL 2024 (Inciso 5.2): PRESIÓN DEL KIPP, ESTEQUIOMETRÍA Y MEZCLA HÚMEDA',
          dataStripHtml:
            '<span><strong>h_HCl:</strong> 450 mm (d = 1,07 g/mL)</span><span><strong>P_atm:</strong> 757,7 torr</span><span><strong>Muestra:</strong> 3,26 g al 89,0% CaCO₃ (PM=100)</span><span><strong>T:</strong> 22,3 °C = 295,45 K</span>',
          fields: [
            {
              id: 'p2_kipp_pkipp',
              label: '(i) Presión absoluta del CO₂ dentro del Kipp cerrado (en torr)',
              formulaHint: 'P_Kipp = P_atm + h_mm × (d_HCl / d_Hg) = 757,7 + 450 × (1,07 / 13,6)',
              unit: 'torr',
              targetValue: 757.7 + (450.0 * 1.07) / 13.6,
              decimals: 1,
              absTol: 0.5
            },
            {
              id: 'p2_kipp_nco2',
              label: '(ii-a) Moles de CO₂ producidos por 3,26 g de caliza (89,0% pureza)',
              formulaHint: 'm_puro = 3,26 × 0,890 = 2,9014 g CaCO₃  →  n_CO2 = m_puro / 100,0',
              unit: 'mol',
              targetValue: (3.26 * 0.89) / 100.0,
              decimals: 5,
              relTol: 0.015
            },
            {
              id: 'p2_kipp_vamp',
              label: '(ii-b) Volumen de la ampolla llenada a 757,7 torr y 295,45 K (en Litros)',
              formulaHint: 'V(L) = n_CO2 × 0,08206 × 295,45 / (757,7 / 760)',
              unit: 'L',
              targetValue: (((3.26 * 0.89) / 100.0) * 0.08206 * 295.45) / (757.7 / 760.0),
              decimals: 3,
              relTol: 0.02
            },
            {
              id: 'p2_kipp_mhum',
              label: '(iii) Masa de gas en la ampolla si 10% molar es H₂O(v) (PM=18) y 90% es CO₂ (PM=44)',
              formulaHint: 'PM_medio = 0,90×44 + 0,10×18 = 41,4 g/mol  →  m_total = n_tot × 41,4',
              unit: 'g',
              targetValue: ((3.26 * 0.89) / 100.0) * (0.9 * 44.0 + 0.1 * 18.0),
              decimals: 3,
              relTol: 0.02
            }
          ]
        }
      },
      {
        id: 'tp2_parcial_2023_errores',
        title: 'Parcial 2023 (Inciso 3.15 PDF): Errores en Densidad por falta de frasco 1, CaCO₃ puro y generación de SO₃',
        type: 'conceptual',
        prompt:
          '«Pregunta de Segundo Parcial (2023, Inciso 3.15 del PDF): Indique y justifique qué tipo de error (por exceso, por defecto o ninguno) cometería en la densidad del CO₂ determinada en el TP si: (i) no se coloca el primer frasco lavador (con agua); (ii) no se hace el balance de presiones (giro de 180°); (iii) el CaCO₃ usado en el Kipp era 100% puro; (iv) en el Kipp además de CO₂ se genera SO₃ (PM = 80 g/mol) que no es retenido completamente por el tren lavador.»',
        options: [
          {
            label:
              'A) (i) DEFECTO (pasa HCl gaseoso, PM 36,5 < 44); (ii) EXCESO (queda P_Kipp > P_atm, entra más masa m₁); (iii) NINGÚN ERROR (solo genera CO₂ puro sin impurezas); (iv) EXCESO (el SO₃ tiene PM = 80 g/mol > 44 g/mol, aumentando m₁)',
            correct: true,
            feedback:
              '«¡Resolución perfecta! Siempre comparamos el peso molecular de la impureza gaseosa respecto al del CO₂ (44 g/mol): el HCl (36,5) y el H₂O(v) (18) son más livianos y dan error por defecto, mientras que el SO₃ (80) o la sobrepresión del Kipp aumentan m₁ y dan error por exceso.»'
          },
          {
            label:
              'B) Tanto el HCl como el SO₃ dan error por exceso porque se suman a la masa del CO₂ que ya estaba en la ampolla',
            correct: false,
            feedback:
              '«¡Cuidado con esa trampa clásica de parcial! A P, V y T fijos, el número total de moles n_total = PV/(RT) dentro de la ampolla es constante: cada mol de HCl (36,5 g/mol) que entra DESPLAZA a un mol de CO₂ (44 g/mol), achicando la masa total m₁.»'
          }
        ]
      }
    ],

    // =========================================================================
    // TP 3: PESOS MOLECULARES — MÉTODO DE VÍCTOR MEYER (Guía págs. 46-48)
    // =========================================================================
    tp3: [
      {
        id: 'tp3_q5_q18',
        title: 'Preguntas 5, 18 y 19 (Págs. 46-47): Puesta en régimen y apagado seguro del equipo',
        type: 'conceptual',
        prompt:
          '«Analicemos dos maniobras críticas de las Preguntas 5 y 18 de la Guía: 1) ¿Por qué NO debe ubicarse la campana colectora sobre el tubo de desprendimiento antes de que el baño alcance régimen (100 °C)? y 2) ¿Por qué al finalizar la experiencia NUNCA debe apagarse el mechero sin haber retirado antes el tapón del tubo de vaporización?»',
        options: [
          {
            label:
              'A) Porque durante el calentamiento inicial el aire del tubo se dilata y burbujearía en la campana; y si al final apagamos el mechero con el tubo tapado, al enfriarse baja la presión interna y reabsorbe el agua del cristalizador hacia el tubo caliente',
            correct: true,
            feedback:
              '«¡Exacto! Ambas precauciones se deben a la Ley de Charles-Gay Lussac: al calentar, el aire se expande; y al enfriar con el sistema cerrado, la contracción térmica succiona el agua de la cuba hidroneumática hacia el tubo de vaporización.»'
          },
          {
            label:
              'B) Porque el agua del cristalizador se calentaría demasiado y porque el tapón de goma podría quedarse pegado al vidrio',
            correct: false,
            feedback:
              '«Pensá qué ocurre con la presión del gas dentro del tubo de vaporización cuando se apaga el mechero y la temperatura cae de 100 °C a 20 °C estando el tapón colocado.»'
          }
        ]
      },
      {
        id: 'tp3_q7_q20',
        title: 'Preguntas 7, 15 y 20 (Págs. 46-47): ¿Qué gas entra a la campana y por qué la Fórmula Molecular da exacta?',
        type: 'conceptual',
        prompt:
          '«En las Preguntas 7, 15 y 20 de la Guía se pregunta: ¿Qué gas es el que realmente entra y se mide en la campana colectora (y por qué el tubo de Víctor Meyer debe ser tan largo)? Y si el método tiene un error del 5 al 10% en el PM, ¿cómo es posible que permita obtener la Fórmula Molecular sin error?»',
        options: [
          {
            label:
              'A) En la campana se recoge AIRE desplazado (si llegara vapor orgánico al agua fría condensaría, por eso el tubo es largo); y la Fórmula Molecular da exacta porque el PM experimental solo se usa para hallar el entero n = PM_exp / PM_mínima',
            correct: true,
            feedback:
              '«¡Clarísimo! Como el multiplicador n de la fórmula mínima (FM = (Fórm. Mín.)_n) debe ser obligatoriamente un número entero (1, 2, 3...), un error del 5-8% en el PM experimental no impide identificar el entero n exacto.»'
          },
          {
            label:
              'B) En la campana se recoge el vapor de la sustancia orgánica pura, que permanece gaseosa a 20 °C bajo el agua',
            correct: false,
            feedback:
              '«Recordá que la muestra problema es un líquido a temperatura ambiente (por ejemplo cloroformo, T_eb = 61 °C). Si su vapor llegara al agua a 20 °C de la campana, condensaría inmediatamente a líquido.»'
          }
        ]
      },
      {
        id: 'tp3_p7',
        title: 'Problema 7 (Pág. 48): Masa máxima admisible para no desbordar la campana',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 7 de la página 48: ¿Cuál es la masa máxima de tricloroetileno (C₂HCl₃, PM = 131,39 g/mol) que puede pesarse en la ampollita de un equipo de Víctor Meyer cuya campana colectora tiene una capacidad máxima V_máx = 40,0 mL (0,0400 L)? Datos: P_ext = 760 torr y P_v(H₂O) = 18,0 torr a t = 20,0 °C (293,15 K).»',
        workbench: {
          title: 'PROBLEMA 7 (Pág. 48): CÁLCULO DE LA MASA MÁXIMA DE MUESTRA',
          dataStripHtml:
            '<span><strong>Compuesto:</strong> C₂HCl₃ (PM = 131,39 g/mol)</span><span><strong>V_máx campana:</strong> 40,0 mL = 0,0400 L</span><span><strong>T:</strong> 20,0 °C = 293,15 K</span><span><strong>P_ext:</strong> 760 torr</span><span><strong>P_v(H₂O):</strong> 18,0 torr</span>',
          fields: [
            {
              id: 'p3_p7_p',
              label: '1. Presión parcial del aire seco en la campana (P_seco en atm)',
              formulaHint: 'P_seco(atm) = (760 - 18,0) / 760',
              unit: 'atm',
              targetValue: (760.0 - 18.0) / 760.0,
              decimals: 4,
              relTol: 0.01
            },
            {
              id: 'p3_p7_n',
              label: '2. Moles máximos de gas que caben en los 40,0 mL (n_máx)',
              formulaHint: 'n_máx = (P_seco · 0,0400) / (0,08206 · 293,15)',
              unit: 'mol',
              targetValue: (((760.0 - 18.0) / 760.0) * 0.04) / (0.08206 * 293.15),
              decimals: 5,
              relTol: 0.015
            },
            {
              id: 'p3_p7_m',
              label: '3. Masa máxima de C₂HCl₃ a pesar en la ampollita (m_máx en gramos)',
              formulaHint: 'm_máx(g) = n_máx × 131,39',
              unit: 'g',
              targetValue: ((((760.0 - 18.0) / 760.0) * 0.04) / (0.08206 * 293.15)) * 131.39,
              decimals: 4,
              relTol: 0.015
            }
          ]
        }
      },
      {
        id: 'tp3_p11',
        title: 'Problema 11 y Pregunta 9 (Págs. 46 y 48): Volumen en la campana vs. Volumen en el tubo caliente',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 11 de la página 48: Se recogen V = 30,0 mL de gas a 22,0 °C (295,15 K) en la campana; P_ext = 765 torr, P_v(H₂O) = 25,0 torr y el nivel de agua dentro de la campana está h = 12,5 cm (125 mm H₂O) por encima del nivel externo. 1) Calculá cuántos milimoles de gas se recogieron, y 2) ¿Qué volumen (en mL) ocupaban esos mismos moles dentro del tubo de vaporización a 100,0 °C (373,15 K) y P_ext = 765 torr?»',
        workbench: {
          title: 'PROBLEMA 11 (Pág. 48): MOLES EN CAMPANA Y VOLUMEN EN EL TUBO A 100 °C',
          dataStripHtml:
            '<span><strong>V_campana:</strong> 30,0 mL a 295,15 K</span><span><strong>P_ext:</strong> 765 torr</span><span><strong>P_v:</strong> 25,0 torr</span><span><strong>h:</strong> 125 mm H₂O (P_h = 125 / 13,6 = 9,19 torr)</span><span><strong>T_tubo:</strong> 373,15 K (a 765 torr)</span>',
          fields: [
            {
              id: 'p3_p11_pseco',
              label: '1. Presión del aire seco en la campana en torr (P_seco)',
              formulaHint: 'P_seco = 765 - 25,0 - (125 / 13,6)',
              unit: 'torr',
              targetValue: 765.0 - 25.0 - 125.0 / 13.6,
              decimals: 2,
              absTol: 0.3
            },
            {
              id: 'p3_p11_n',
              label: '2. Milimoles de gas recogidos en la campana (n en mmol)',
              formulaHint: 'n(mmol) = [(P_seco / 760) × 30,0] / (0,08206 × 295,15)',
              unit: 'mmol',
              targetValue: (((765.0 - 25.0 - 125.0 / 13.6) / 760.0) * 30.0) / (0.08206 * 295.15),
              decimals: 4,
              relTol: 0.015
            },
            {
              id: 'p3_p11_vtubo',
              label: '3. Volumen que ocupaban esos moles en el tubo a 100 °C y 765 torr (V_tubo)',
              formulaHint: 'V_tubo(mL) = [n(mmol) × 0,08206 × 373,15] / (765 / 760)',
              unit: 'mL',
              targetValue:
                ((((765.0 - 25.0 - 125.0 / 13.6) / 760.0) * 30.0) / (0.08206 * 295.15)) *
                0.08206 *
                373.15 /
                (765.0 / 760.0),
              decimals: 2,
              relTol: 0.02
            }
          ]
        }
      },
      {
        id: 'tp3_p13',
        title: 'Problema 13 (Pág. 48): Análisis integral de situaciones experimentales con Cloroformo y Acetato de Etilo',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 13 de la página 48: Con una ampolla de cloroformo (CHCl₃, PM = 119,38 g/mol) se recogen V = 36,0 mL de gas, con columna de agua h = 10,0 cm (100 mm H₂O), T = 31,0 °C (304,15 K, P_v = 33,6 mmHg) y P_atm = 758,0 mmHg. Calculá: (a) la masa de cloroformo que tenía la ampolla; (b-i) qué masa de acetato de etilo (PM = 88,11 g/mol) daría el mismo volumen de 36,0 mL; y (b-ii) qué volumen se recogería si por mal insuflado el gas desplazado tuviera un 40% de vapor previo que condensa en el agua.»',
        workbench: {
          title: 'PROBLEMA 13 (Pág. 48): SITUACIONES EXPERIMENTALES EN VÍCTOR MEYER',
          dataStripHtml:
            '<span><strong>V:</strong> 36,0 mL</span><span><strong>h:</strong> 100 mm H₂O (P_h = 7,35 mmHg)</span><span><strong>T:</strong> 304,15 K (P_v = 33,6 mmHg)</span><span><strong>P_atm:</strong> 758,0 mmHg</span>',
          fields: [
            {
              id: 'p3_p13_mcl',
              label: '(a) Masa de cloroformo (PM = 119,38 g/mol) en la ampolla (en gramos)',
              formulaHint: 'P_seco = (758 - 33,6 - 7,35)/760 = 0,9435 atm  →  m = (P_seco · 0,036 · 119,38) / (0,08206 · 304,15)',
              unit: 'g',
              targetValue: (((758.0 - 33.6 - 100.0 / 13.6) / 760.0) * 0.036 * 119.38) / (0.08206 * 304.15),
              decimals: 4,
              relTol: 0.02
            },
            {
              id: 'p3_p13_mac',
              label: '(b-i) Masa de acetato de etilo (PM = 88,11 g/mol) para recoger igual V = 36,0 mL',
              formulaHint: 'A igual número de moles desplazados: m_acetato = m_cloroformo × (88,11 / 119,38)',
              unit: 'g',
              targetValue: (((758.0 - 33.6 - 100.0 / 13.6) / 760.0) * 0.036 * 88.11) / (0.08206 * 304.15),
              decimals: 4,
              relTol: 0.02
            },
            {
              id: 'p3_p13_v60',
              label: '(b-ii) Volumen recogido si el 40% del gas desplazado era vapor previo (solo 60% aire)',
              formulaHint: 'El 40% de vapor orgánico condensa al entrar al agua fría  →  V_recogido = 0,60 × 36,0 mL',
              unit: 'mL',
              targetValue: 21.6,
              decimals: 1,
              absTol: 0.2
            }
          ]
        }
      },
      {
        id: 'tp3_parcial_errores_vm',
        title: 'Parciales 2024-2026 (Incisos 3.3, 3.8 y 3.12 PDF): Ampolla trabada, aceite a 147 °C, régimen y Pv(H₂O)',
        type: 'conceptual',
        prompt:
          '«Pregunta recurrente de Segundo Parcial (Incisos 3.3, 3.8 y 3.12 del PDF): Indique y justifique qué tipo de error (por exceso, por defecto o ninguno) cometería en la determinación del Peso Molecular (PM = m·R·T / (P·V)) por Víctor Meyer si: (i) la ampollita queda trabada en la parte superior (fría) del tubo de vaporización; (ii) el equipo aún no estaba en régimen (temperatura en ascenso) al arrojar la ampollita; (iii) se reemplaza el agua del baño calefactor (100 °C) por un aceite de punto de ebullición 147 °C en régimen; (iv) no se resta la presión de vapor del agua al calcular P del gas.»',
        options: [
          {
            label:
              'A) (i) EXCESO (no vaporiza todo → menor V en el denominador); (ii) DEFECTO (el aire del tubo sigue dilatándose → mayor V en la campana); (iii) NINGÚN ERROR (a 147 °C en régimen vaporiza 100% y desplaza los mismos moles de aire a T_campana); (iv) DEFECTO (usa P mayor en el denominador)',
            correct: true,
            feedback:
              '«¡Dominio total del método de Víctor Meyer! Mirando PM = m·R·T / (P·V): todo lo que achique V en la campana (ampolla trabada arriba, sustancia de alto T_eb, fuga por el tapón) da error por EXCESO; todo lo que agrande V (equipo calentándose fuera de régimen) o agrande P (olvidar restar P_v o h/13,6) da error por DEFECTO; y usar un baño a 147 °C en régimen no altera los moles desplazados.»'
          },
          {
            label:
              'B) Reemplazar el agua por aceite a 147 °C da error por defecto porque a mayor temperatura el gas se expande más',
            correct: false,
            feedback:
              '«¡Ojo! Si el baño de aceite a 147 °C ya alcanzó el RÉGIMEN estacionario antes de arrojar la ampolla, 1 mol de sustancia vaporizada a 147 °C desplaza exactamente 1 mol de aire hacia la campana, donde ese mol se enfría a T_ambiente ocupando el mismo volumen V.»'
          }
        ]
      },
      {
        id: 'tp3_parcial_formula_centesimal',
        title: 'Parcial 2024 (Inciso 3.11 PDF): Peso Molecular y Fórmula Molecular desde Composición Centesimal',
        type: 'calc_only',
        prompt:
          '«Ejercicio de Segundo Parcial (2024, Inciso 3.11 del PDF): En una experiencia de Víctor Meyer se pesaron m = 0,0986 g de una sustancia cuya composición centesimal es C: 24,24%, Cl: 71,71% y H: 4,05% (Fórmula mínima: CH₂Cl, PM_mín = 49,5 g/mol). El volumen recogido a 22,9 °C (296,05 K) fue V = 25,2 mL (0,0252 L). La presión atmosférica era 764,6 mmHg, P_v(agua) = 25,3 torr y la columna de agua en la campana estaba h = 12,0 cm (120 mm H₂O) por encima del nivel externo. Calculá la presión del gas seco, el Peso Molecular experimental y la atomicidad n de la Fórmula Molecular (CH₂Cl)_n.»',
        workbench: {
          title: 'PARCIAL 2024 (Inciso 3.11): DETERMINACIÓN DE PM Y FÓRMULA MOLECULAR (C₂H₄Cl₂)',
          dataStripHtml:
            '<span><strong>m:</strong> 0,0986 g</span><span><strong>V:</strong> 25,2 mL (0,0252 L) a 296,05 K</span><span><strong>P_atm:</strong> 764,6 torr</span><span><strong>P_v:</strong> 25,3 torr</span><span><strong>h:</strong> 120 mm H₂O</span><span><strong>Fórm. mín.:</strong> CH₂Cl (49,5 g/mol)</span>',
          fields: [
            {
              id: 'p3_2024_pseco',
              label: '1. Presión del aire seco en la campana en atmósferas (P_seco)',
              formulaHint: 'P_seco(atm) = [764,6 - 25,3 - (120 / 13,6)] / 760',
              unit: 'atm',
              targetValue: (764.6 - 25.3 - 120.0 / 13.6) / 760.0,
              decimals: 4,
              relTol: 0.01
            },
            {
              id: 'p3_2024_pm',
              label: '2. Peso Molecular experimental de la sustancia (PM_exp)',
              formulaHint: 'PM = (0,0986 × 0,08206 × 296,05) / (P_seco × 0,0252)',
              unit: 'g/mol',
              targetValue: (0.0986 * 0.08206 * 296.05) / (((764.6 - 25.3 - 120.0 / 13.6) / 760.0) * 0.0252),
              decimals: 2,
              relTol: 0.02
            },
            {
              id: 'p3_2024_n',
              label: '3. Multiplicador entero n = PM_exp / PM(CH₂Cl) para la Fórmula Molecular (C₂H₄Cl₂)',
              formulaHint: 'n = redondear(PM_exp / 49,5)',
              unit: 'entero',
              targetValue: 2,
              decimals: 0,
              absTol: 0.2
            }
          ]
        }
      }
    ],

    // =========================================================================
    // TP 4: CALORIMETRÍA — CALOR DE NEUTRALIZACIÓN (Guía pág. 57)
    // =========================================================================
    tp4: [
      {
        id: 'tp4_p2_p9',
        title: 'Problemas 2, 9, 11 y 12 (Pág. 57): Dilución de la base, precisión del termómetro y signo de E',
        type: 'conceptual',
        prompt:
          '«En los Problemas 2, 9 y 12 de la página 57 se plantean tres preguntas clave: 1) ¿Por qué en nuestro TP no necesitamos medir el calor de dilución del NaOH y solo medimos el del HCl? 2) ¿Qué harías si solo contaras con un termómetro común de menor precisión que el de Beckmann? y 3) ¿Qué signo debe tener siempre el equivalente en agua E del calorímetro?»',
        options: [
          {
            label:
              'A) Porque el NaOH ya se coloca diluido con los 100 mL de agua en el termo antes de medir T₁ (mientras que el HCl 2 N está concentrado en la ampolla); con un termómetro menos preciso usaríamos soluciones más concentradas o menos agua para agrandar ΔT; y E es siempre POSITIVO (E > 0)',
            correct: true,
            feedback:
              '«¡Excelente! La base se diluye antes de iniciar la marcha calorimétrica; aumentar la concentración o reducir la masa de agua aumenta el salto térmico ΔT reduciendo el error relativo de lectura; y E = Σ(m_i·c_i) es una capacidad calorífica por lo que es estrictamente positiva.»'
          },
          {
            label:
              'B) Porque las bases fuertes nunca liberan calor al diluirse, y el equivalente en agua E puede ser negativo si el termo pierde calor',
            correct: false,
            feedback:
              '«¡Cuidado! Si el NaOH estuviera muy concentrado en la ampolla sí liberaría calor de dilución; y el equivalente en agua E = Σ m_i·c_i jamás puede ser negativo porque las masas y calores específicos son positivos.»'
          }
        ]
      },
      {
        id: 'tp4_p8',
        title: 'Problema 8 (Pág. 57): Forma de las curvas de marcha calorimétrica en un termo no adiabático',
        type: 'conceptual',
        prompt:
          '«En el Problema 8 de la página 57 se analiza cómo se ven las pendientes pre-reacción (recta a) y post-reacción (recta b) cuando el calorímetro NO es totalmente adiabático. En el caso (c), donde la temperatura exterior del laboratorio (T_ext) es INTERMEDIA entre la temperatura inicial fría (T₁) y la temperatura final caliente luego de la neutralización (T₂): ¿cómo son las pendientes de las rectas a y b?»',
        options: [
          {
            label:
              'A) Antes de mezclar (T₁ < T_ext) el calorímetro absorbe calor del ambiente y la recta "a" tiene pendiente POSITIVA; después de reaccionar (T₂ > T_ext) el calorímetro cede calor al ambiente y la recta "b" tiene pendiente NEGATIVA (como en la Figura 3 de la pág. 54)',
            correct: true,
            feedback:
              '«¡Exacto! Por eso la Figura 3 de la página 54 tiene pendiente ascendente antes de insuflar y pendiente descendente luego del máximo térmico.»'
          },
          {
            label:
              'B) Ambas rectas (a y b) son horizontales porque el intercambio con el exterior se cancela',
            correct: false,
            feedback:
              '«Si el termo no es adiabático, mientras T_termo < T_ext entra calor del ambiente (T sube lentamente) y cuando T_termo > T_ext sale calor hacia el ambiente (T baja lentamente).»'
          }
        ]
      },
      {
        id: 'tp4_p3',
        title: 'Problema 3 (Pág. 57): Cálculo del Equivalente en Agua del Calorímetro (E)',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 3 de la página 57: Un termo tiene inicialmente en equilibrio térmico m₁ = 30,0 g de agua a T_a = 22,0 °C. Se agregan m₂ = 100,0 g de agua a T_c = 95,0 °C, observándose una temperatura final de equilibrio T_f = 62,2 °C. Calculá el equivalente en agua del calorímetro (E, en cal/°C).»',
        workbench: {
          title: 'PROBLEMA 3 (Pág. 57): EQUIVALENTE EN AGUA DEL CALORÍMETRO',
          dataStripHtml:
            '<span><strong>m₁ (fría):</strong> 30,0 g a T_a = 22,0 °C</span><span><strong>m₂ (caliente):</strong> 100,0 g a T_c = 95,0 °C</span><span><strong>T_f (equilibrio):</strong> 62,2 °C</span><span><strong>c_agua:</strong> 1,00 cal/(g·°C)</span>',
          fields: [
            {
              id: 'p4_p3_qced',
              label: '1. Calor cedido por los 100,0 g de agua caliente: m₂·c·(95,0 - 62,2)',
              formulaHint: 'Q_cedido = 100,0 × 1,00 × (95,0 - 62,2)',
              unit: 'cal',
              targetValue: 100.0 * (95.0 - 62.2),
              decimals: 1,
              absTol: 5
            },
            {
              id: 'p4_p3_e',
              label: '2. Equivalente en agua del calorímetro (E)',
              formulaHint: 'De 0 = (m₁ + E)(62,2 - 22,0) + 100(62,2 - 95,0)  →  E = [3280 / 40,2] - 30,0',
              unit: 'cal/°C',
              targetValue: (100.0 * (95.0 - 62.2)) / (62.2 - 22.0) - 30.0,
              decimals: 2,
              absTol: 0.3
            }
          ]
        }
      },
      {
        id: 'tp4_p4_p5',
        title: 'Problemas 4 y 5 (Pág. 57): Neutralización con reactivo limitante y predicción de ΔT',
        type: 'calc_only',
        prompt:
          '«Resolvamos los Problemas 4 y 5 de la página 57: Se mezclan 15,0 mL de solución de H₂SO₄ 0,15 M (ácido diprótico → N = 0,30 N) con 25,0 mL de solución de KOH 0,12 M (N = 0,12 N). El calor de neutralización es 13,6 kcal/eq (13600 cal/eq). 1) Calculá cuántos equivalentes se neutralizan (reactivo limitante) y el calor liberado (Prob. 4); 2) Si la mezcla se realiza en un termo con E = 40,0 cal/°C que además contiene 100,0 mL de agua (masa total m_sol = 15 + 25 + 100 = 140,0 g), ¿cuál será la variación de temperatura ΔT que sufrirá el sistema (Prob. 5)?»',
        workbench: {
          title: 'PROBLEMAS 4 y 5 (Pág. 57): REACTIVO LIMITANTE Y SALTO TÉRMICO ΔT',
          dataStripHtml:
            '<span><strong>H₂SO₄:</strong> 15,0 mL de 0,15 M (0,30 N)</span><span><strong>KOH:</strong> 25,0 mL de 0,12 M (0,12 N)</span><span><strong>|ΔH_neut|:</strong> 13600 cal/eq</span><span><strong>m_total solución:</strong> 140,0 g</span><span><strong>E:</strong> 40,0 cal/°C</span>',
          fields: [
            {
              id: 'p4_p4_eq_ac',
              label: '1. Equivalentes presentes de H₂SO₄ (diprótico: 2 eq/mol)',
              formulaHint: 'eq(H₂SO₄) = 0,015 L × (0,15 × 2) eq/L',
              unit: 'eq',
              targetValue: 0.0045,
              decimals: 4,
              absTol: 0.0002
            },
            {
              id: 'p4_p4_eq_ba',
              label: '2. Equivalentes presentes de KOH (reactivo limitante)',
              formulaHint: 'eq(KOH) = 0,025 L × 0,12 eq/L',
              unit: 'eq',
              targetValue: 0.003,
              decimals: 4,
              absTol: 0.0002
            },
            {
              id: 'p4_p4_q',
              label: '3. Cantidad de calor liberado en la neutralización (|Q| en calorías)',
              formulaHint: '|Q| = eq_limitante × 13600 cal/eq = 0,0030 × 13600',
              unit: 'cal',
              targetValue: 40.8,
              decimals: 2,
              absTol: 0.5
            },
            {
              id: 'p4_p5_dt',
              label: '4. Variación de temperatura ΔT del sistema (Problema 5)',
              formulaHint: 'ΔT = |Q| / (m_sol·c + E) = 40,8 / (140,0 + 40,0)',
              unit: '°C',
              targetValue: 40.8 / 180.0,
              decimals: 4,
              absTol: 0.005
            }
          ]
        }
      },
      {
        id: 'tp4_p6',
        title: 'Problema 6 (Pág. 57): Cálculo del calor de dilución por equivalente de HNO₃',
        type: 'calc_only',
        prompt:
          '«Resolvamos el Problema 6 de la página 57: Al agregar 15,0 mL de HNO₃ 0,25 M (0,25 N) a 125,0 mL de agua destilada (m_sol = 140,0 g) en un termo con equivalente en agua E = 40,0 cal/°C, se produce una elevación de temperatura ΔT = +0,040 °C. Calculá el calor liberado en la experiencia y el calor de dilución expresado en cal/eq y kcal/eq.»',
        workbench: {
          title: 'PROBLEMA 6 (Pág. 57): CALOR DE DILUCIÓN POR EQUIVALENTE',
          dataStripHtml:
            '<span><strong>HNO₃:</strong> 15,0 mL de 0,25 N</span><span><strong>Agua:</strong> 125,0 mL (m_sol = 140,0 g)</span><span><strong>E:</strong> 40,0 cal/°C</span><span><strong>ΔT_dil:</strong> +0,040 °C</span>',
          fields: [
            {
              id: 'p4_p6_q',
              label: '1. Calor absorbido por el sistema calorimétrico (|Q_dil| en cal)',
              formulaHint: '|Q_dil| = (m_sol·1 + E) × ΔT = (140,0 + 40,0) × 0,040',
              unit: 'cal',
              targetValue: 7.2,
              decimals: 2,
              absTol: 0.1
            },
            {
              id: 'p4_p6_eq',
              label: '2. Equivalentes de HNO₃ diluidos (n_eq)',
              formulaHint: 'n_eq = 0,015 L × 0,25 eq/L',
              unit: 'eq',
              targetValue: 0.00375,
              decimals: 5,
              absTol: 0.0001
            },
            {
              id: 'p4_p6_dh',
              label: '3. Calor de dilución por equivalente (ΔH_dil en kcal/eq, con signo exotérmico)',
              formulaHint: 'ΔH_dil = (-7,2 cal / 1000) / 0,00375 eq',
              unit: 'kcal/eq',
              targetValue: -1.92,
              decimals: 2,
              absTol: 0.05
            }
          ]
        }
      }
    ]
  };

  function getChallengesForTp(tpKey) {
    return CHALLENGE_BANKS[tpKey] || [];
  }

  return {
    CHALLENGE_BANKS,
    getChallengesForTp
  };
})();
