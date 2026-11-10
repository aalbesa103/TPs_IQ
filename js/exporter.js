/**
 * exporter.js
 * Generador y descargador de informes de laboratorio (.txt y .csv)
 * para los 4 Trabajos Prácticos de la Cátedra de Introducción a la Química (UNLP).
 */

window.Exporter = (function () {
  function padRight(str, len) {
    const s = String(str);
    return s.length >= len ? s : s + ' '.repeat(len - s.length);
  }

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  return {
    exportReportTxt: function (tpId, reportData) {
      const nowStr = new Date().toLocaleString('es-AR');
      const lines = [];
      lines.push('================================================================================');
      lines.push('UNIVERSIDAD NACIONAL DE LA PLATA - FACULTAD DE CIENCIAS EXACTAS');
      lines.push('DEPARTAMENTO DE QUÍMICA - CÁTEDRA DE INTRODUCCIÓN A LA QUÍMICA');
      lines.push(`TRABAJO PRÁCTICO: ${reportData.title.toUpperCase()}`);
      lines.push('================================================================================');
      lines.push(`Fecha y hora de emisión: ${nowStr}`);
      lines.push(`Modalidad de trabajo:    ${reportData.modeLabel || 'Modo Alumno'}`);
      lines.push('--------------------------------------------------------------------------------');

      if (Array.isArray(reportData.metaLines)) {
        reportData.metaLines.forEach(m => lines.push(m));
        lines.push('--------------------------------------------------------------------------------');
      }

      if (Array.isArray(reportData.headers) && Array.isArray(reportData.rows)) {
        lines.push('TABLA DE DATOS EXPERIMENTALES:');
        lines.push(reportData.headers.map(h => padRight(h, 15)).join(' | '));
        lines.push('-'.repeat(Math.min(100, reportData.headers.length * 18)));
        reportData.rows.forEach(r => {
          lines.push(r.map(cell => padRight(cell, 15)).join(' | '));
        });
        lines.push('--------------------------------------------------------------------------------');
      }

      if (Array.isArray(reportData.conclusionLines)) {
        lines.push('RESULTADOS Y CONCLUSIONES:');
        reportData.conclusionLines.forEach(c => lines.push(c));
        lines.push('================================================================================');
      }

      const safeName = `Informe_IQ_${tpId}_${new Date().toISOString().slice(0, 10)}.txt`;
      triggerDownload(lines.join('\r\n'), safeName, 'text/plain');
    },

    exportReportCsv: function (tpId, reportData) {
      const lines = [];
      lines.push(`# UNLP - Facultad de Ciencias Exactas - Introduccion a la Quimica`);
      lines.push(`# TP: ${reportData.title}`);
      if (Array.isArray(reportData.metaLines)) {
        reportData.metaLines.forEach(m => lines.push(`# ${m.replace(/,/g, ';')}`));
      }
      if (Array.isArray(reportData.headers)) {
        lines.push(reportData.headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
      }
      if (Array.isArray(reportData.rows)) {
        reportData.rows.forEach(r => {
          lines.push(r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
        });
      }
      const safeName = `Datos_IQ_${tpId}_${new Date().toISOString().slice(0, 10)}.csv`;
      triggerDownload(lines.join('\r\n'), safeName, 'text/csv');
    }
  };
})();
