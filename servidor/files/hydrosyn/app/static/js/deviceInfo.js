/**
 * Obtiene información del hardware del cliente
 * @returns {Object} Datos del dispositivo
 */
function getDeviceInfo() {
  return {
    ram: navigator.deviceMemory || null,
    cores: navigator.hardwareConcurrency || 1,
    arch: navigator.platform.includes('64') ? 'x64' : 'x86',
    os: getOS(),
    gpu: getGPUInfo()
  };
}

/**
 * Detecta el sistema operativo
 */
function getOS() {
  const userAgent = navigator.userAgent;
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  return 'Unknown';
}

/**
 * Obtiene información de la GPU
 */
function getGPUInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_INFO) : null;
  } catch (e) {
    console.error("Error al detectar GPU:", e);
    return null;
  }
}

/**
 * Sobreescribe fetch() global para incluir siempre los headers del dispositivo
 */
function overrideGlobalFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options = {}) {
  const deviceInfo = getDeviceInfo();
  const currentUrl = window.location.pathname; // solo ruta actual

  const newOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-Device-RAM': deviceInfo.ram,
      'X-Device-CPU-Cores': deviceInfo.cores,
      'X-Device-CPU-Arch': deviceInfo.arch,
      'X-Device-GPU': deviceInfo.gpu,
      'X-Device-OS': deviceInfo.os,
      'X-Origin-Path': currentUrl,    // <-- Aquí agregas la ruta de origen
    }
  };

  return originalFetch(url, newOptions);
};

}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  overrideGlobalFetch(); // Aplica a TODAS las peticiones fetch
  
  // Opcional: También puedes mantener el interceptor de formularios
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      fetch(this.action, {
        method: this.method,
        body: new FormData(this)
      });
    });
  });
});
