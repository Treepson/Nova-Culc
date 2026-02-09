# Об'єднані калькулятори TIRAS NOVA

Це об'єднаний проект калькуляторів ємності АКБ для серії приладів Orion NOVA.

## Структура проекту

```
nova-calculators/
├── index.html                 # Головна сторінка з вибором приладу
├── device-template.html       # Шаблон для сторінок приладів
├── devices/                   # HTML сторінки для кожного приладу
│   ├── nova-l-lte.html
│   ├── nova-m-lte.html
│   ├── nova-s-lte.html
│   ├── nova-l.html
│   ├── nova-m.html
│   ├── nova-s.html
│   └── nova-xs.html
├── scripts/                   # JavaScript файли
│   ├── home.js               # Логіка головної сторінки
│   └── calculator.js         # Універсальний калькулятор
├── styles/                    # CSS файли
│   ├── main.css              # Стилі головної сторінки
│   └── calculator.css        # Стилі калькулятора
├── data/                      # JSON конфігурації
│   ├── devices-config.json   # Конфігурація приладів
│   └── components.json       # Конфігурація компонентів
└── assets/                    # Зображення, шрифти
    ├── images/
    ├── fonts/
    ├── boards/               # Зображення плат приладів
    ├── modules/              # Зображення модулів
    ├── kb/                   # Зображення клавіатур
    ├── sensors/              # Зображення датчиків
    └── sirens/               # Зображення сирен
```

## Як це працює

### 1. Головна сторінка (index.html)
- Показує список всіх доступних приладів
- При виборі приладу переходить на відповідну сторінку калькулятора

### 2. Конфігурація приладів (data/devices-config.json)
Містить налаштування для кожного приладу:
- ID приладу
- Назва
- Посилання на базу знань
- Позиції hotspots на платі
- Базове споживання
- Наявність другого універсального слота

### 3. Конфігурація компонентів (data/components.json)
Містить всі компоненти системи:
- Внутрішні модулі (modulesInner)
- Групи клавіатур (keyboardGroups)
- Зовнішні модулі (modulesExt)
- Датчики (sensors)
- Сирени (sirens)
- Ліміти слотів (slotLimits)
- Конфлікти модулів (moduleConflicts)

### 4. Універсальний калькулятор (scripts/calculator.js)
- Завантажує конфігурацію з JSON файлів
- Динамічно генерує UI на основі конфігурації
- Працює з усіма приладами через єдиний код

## Як додати новий прилад

1. Додайте конфігурацію приладу в `data/devices-config.json`:
```json
{
  "id": "nova-new",
  "name": "Orion NOVA NEW",
  "title": "Калькулятор ємності АКБ • Orion NOVA NEW",
  "backLink": "https://tiras.technology/devices/orion-nova-new/",
  "boardImage": "assets/boards/nova-new.png",
  "hotspots": {
    "mod1": { "left": "30%", "top": "15%" },
    "kb": { "left": "50%", "top": "35%" },
    "sens": { "left": "30%", "top": "35%" },
    "sir": { "left": "25%", "top": "20%" }
  },
  "baseDevice": {
    "name": "Orion NOVA NEW",
    "normal": 140,
    "alarm": 140
  },
  "hasModSlot2": false
}
```

2. Додайте прилад в `scripts/home.js` в масив `devices`

3. Створіть HTML файл:
```bash
cp device-template.html devices/nova-new.html
```

4. Додайте зображення плати в `assets/boards/nova-new.png`

## Як додати нові компоненти

Відредагуйте `data/components.json` та додайте нові елементи в відповідні масиви.

## Важливі файли

### assets/
Вам потрібно буде додати всі зображення:
- Плати приладів
- Модулі
- Клавіатури
- Датчики
- Сирени
- Шрифт Neue Machina

Структура:
```
assets/
├── boards/
│   ├── nova-l-lte.png
│   ├── nova-m-lte.png
│   └── ...
├── modules/
│   ├── M-OUT2R.png
│   ├── M-X.png
│   └── ...
├── kb/
│   ├── K-LED.png
│   ├── K-Pad.png
│   └── ...
├── sensors/
│   ├── swanquad.png
│   └── ...
├── sirens/
│   ├── dzhmil.png
│   └── ...
└── fonts/
    └── neu_machina/
        ├── NeueMachina-Regular.woff2
        ├── NeueMachina-Regular.woff
        └── NeueMachina-Regular.ttf
```

## Запуск проекту

Просто відкрийте `index.html` у браузері або розмістіть на веб-сервері.

## Особливості

1. **Універсальні слоти** - деякі прилади мають 2 універсальних слоти, деякі - 1
2. **Розширювачі** - підтримка модулів розширення з власними платами
3. **Конфлікти модулів** - M-WiFi та M-NET+ не можуть бути встановлені одночасно
4. **Кастомні значення** - можливість додавати власні датчики та сирени

## Підтримка браузерів

- Chrome/Edge: повна підтримка
- Firefox: повна підтримка  
- Safari: повна підтримка
- IE11: не підтримується

## Ліцензія

Власність TIRAS
