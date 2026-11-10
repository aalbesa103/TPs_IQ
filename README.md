# Laboratorio Virtual Interactivo — Introducción a la Química (UNLP)

Suite de simulaciones interactivas en formato 2D Retro RPG para la cátedra de **Introducción a la Química** (Facultad de Ciencias Exactas — Universidad Nacional de La Plata).

## Trabajos Prácticos incluidos

1. **TP 1: Comportamiento y Leyes de los Gases**
   - Lectura y enrase del **Barómetro de Fortín**.
   - **Ley de Boyle-Mariotte** ($P \cdot V = \text{cte}$) y análisis comparativo de gráficos ($P\text{ vs. }V$, $PV\text{ vs. }V$ y $PV^2\text{ vs. }V$).
   - **Ley de Charles y Gay-Lussac** a volumen constante y extrapolación gráfica del **Cero Absoluto** ($-273{,}15\ ^\circ\text{C}$).
   - **Ley de Difusión de Graham** ($\text{NH}_3 + \text{HCl} \rightarrow \text{NH}_4\text{Cl}_{(s)}$).
2. **TP 2: Densidad de Gases ($\text{CO}_2$)**
   - Generación en **Aparato de Kipp**, tren purificador y desecador ($\text{H}_2\text{O} \rightarrow \text{H}_2\text{SO}_4 \rightarrow \text{Sílica Gel}$).
   - Evacuación y pesadas en **Ampolla de Regnault** ($m_0, m_1, m_2$), equilibrado a $P_{\text{atm}}$ (giro de $180^\circ$) y reducción de la densidad a **CNTP**.
3. **TP 3: Determinación de Pesos Moleculares — Método de Víctor Meyer**
   - Calefacción a régimen ($100\ ^\circ\text{C}$), purgado con aire seco, pesada de microampolla capilar, caída y recolección en campana graduada de $50{,}0\ \text{mL}$ sobre agua.
   - Simulación de desborde por exceso de muestra ($V > 50{,}0\ \text{mL}$), corrección hidrostática ($h$) y por presión de vapor del agua ($P_v$).
4. **TP 4: Calorimetría — Calor de Neutralización**
   - Determinación del **Equivalente en Agua del Calorímetro ($E$)**.
   - Marcha calorimétrica con termómetro diferencial de Beckmann y determinación gráfica de $\Delta T_{\text{total}}$ por el **Método de Áreas Iguales**.
   - Determinación del **Calor de Dilución** y cálculo de $\Delta H_{\text{neutralización}}$ para ácidos fuertes ($\text{HCl}$) y débiles ($\text{CH}_3\text{COOH}$).

## Características Pedagógicas
- **Mesa de Cálculos del Estudiante**: Calculadora científica integrada, verificación paso a paso de magnitudes intermedias y finales, y diagnóstico automático de errores de signo o de conversión de unidades.
- **Modo Alumno / Modo Docente**: Permite simular errores experimentales, saltar libremente entre etapas y ejecutar el autotest de diagnóstico.
- **Bitácora de Laboratorio**: Exportación de informes completos en formatos `.TXT` y `.CSV`.

## Ejecución de pruebas automatizadas
```bash
node tests/autotest.js
```
