(function() {
  'use strict';

  const devicesData = {
    devices: [
      {
        id: 'nova-l-lte',
        name: 'Orion NOVA L (LTE)',
        description: 'Флагман серії Orion NOVA (LTE) для охорони великих комерційних об\'єктів на 16 зон/датчиків з можливістю розширення до 250',
        badge: 'LTE',
        image: 'assets/boards/nova-l-lte.png'
      },
      {
        id: 'nova-m-lte',
        name: 'Orion NOVA M (LTE)',
        description: 'Базова модель серії Orion NOVA LTE для охорони комерційних об\'єктів на 8 дротових зон/датчиків з можливістю розширення до 64',
        badge: 'LTE',
        image: 'assets/boards/nova-m-lte.png'
      },
      {
        id: 'nova-s-lte',
        name: 'Orion NOVA S (LTE)',
        description: 'Компактна модель серії Orion NOVA LTE для охорони квартир, невеликих магазинів на 4 дротові зони/датчиків з можливістю розширення до 32',
        badge: 'LTE',
        image: 'assets/boards/nova-s-lte.png'
      },
      {
        id: 'nova-l',
        name: 'Orion NOVA L',
        description: 'Флагман серії Orion NOVA для охорони великих комерційних об\'єктів на 16 зон/датчиків з можливістю розширення до 250',
        badge: null,
        image: 'assets/boards/nova-l.png'
      },
      {
        id: 'nova-m',
        name: 'Orion NOVA M',
        description: 'Базова модель серії Orion NOVA для охорони комерційних об\'єктів на 8 дротових зон/датчиків з можливістю розширення до 64',
        badge: null,
        image: 'assets/boards/nova-m.png'
      },
      {
        id: 'nova-s',
        name: 'Orion NOVA S',
        description: 'Компактна модель серії Orion NOVA для охорони квартир, невеликих магазинів на 4 дротові зони/датчиків з можливістю розширення до 32',
        badge: null,
        image: 'assets/boards/nova-s.png'
      },
      {
        id: 'nova-xs',
        name: 'Orion NOVA XS',
        description: 'Бюджетна модель серії Orion NOVA для охорони квартир на 4 дротові зони/датчиків з можливістю розширення до 32',
        badge: null,
        image: 'assets/boards/nova-xs.png'
      }
    ]
  };

  function init() {
    renderDeviceCards();
  }

  function renderDeviceCards() {
    const grid = document.getElementById('devicesGrid');
    if (!grid) return;

    grid.innerHTML = devicesData.devices.map(device => `
      <div class="device-card" onclick="selectDevice('${device.id}')">
        <div class="device-icon-image">
          <img src="${device.image}" alt="${device.name}" class="device-board-preview">
          ${device.badge ? `<span class="lte-badge">${device.badge}</span>` : ''}
        </div>
        <h2 class="device-name">${device.name}</h2>
        <p class="device-description">${device.description}</p>
      </div>
    `).join('');
  }

  // Make selectDevice global
  window.selectDevice = function(deviceId) {
    window.location.href = `devices/${deviceId}.html`;
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
