document.addEventListener('DOMContentLoaded', () => {
    // Obtener info del dispositivo
    const deviceInfo = getDeviceInfo();

   
    fetch('/device-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deviceInfo)
   
    });
  });
