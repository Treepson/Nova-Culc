# Інструкції по додаванню Assets

## Необхідні файли

Для правильної роботи калькуляторів вам потрібно скопіювати всі assets з оригінальних проектів.

### 1. Зображення плат (assets/boards/)

Скопіюйте файли `board.png` з кожного проекту та перейменуйте їх:

```bash
# З Nova_L_LTE_Culc.github.io
cp Nova_L_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-l-lte.png

# З Nova_M_LTE_Culc.github.io  
cp Nova_M_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-m-lte.png

# З Nova_S_LTE_Culc.github.io
cp Nova_S_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-s-lte.png

# З Nova_L_Culc.github.io
cp Nova_L_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-l.png

# З Nova_M_Culc.github.io
cp Nova_M_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-m.png

# З Nova_S_Culc.github.io  
cp Nova_S_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-s.png

# З Nova_XS_Culc.github.io
cp Nova_XS_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-xs.png
```

### 2. Модулі (assets/modules/)

Скопіюйте всю папку `assets/modules/` з будь-якого проекту:

```bash
cp -r Nova_L_LTE_Culc.github.io/assets/modules/* nova-calculators/assets/modules/
```

Необхідні файли:
- M-OUT2R.png
- M-OUT2R box.png
- M-OUT8R.png
- M-X.png
- M-WiFi.png
- M-NET+.png
- M-Z+.png
- M-Z.png
- M-Z box.png
- M-ZPBox.png
- M-ZP sBox.png
- M-ZP mBox.png
- P-IND32.png

### 3. Клавіатури (assets/kb/)

Скопіюйте всю папку `assets/kb/` з будь-якого проекту:

```bash
cp -r Nova_L_LTE_Culc.github.io/assets/kb/* nova-calculators/assets/kb/
```

Необхідні файли:
- K-LED.png
- K-Pad.png
- K-GLCD.png
- K-LCD.webp

### 4. Датчики (assets/sensors/)

Скопіюйте всю папку `assets/sensors/` з будь-якого проекту:

```bash
cp -r Nova_L_LTE_Culc.github.io/assets/sensors/* nova-calculators/assets/sensors/
```

Необхідні файли:
- swanquad.png
- swanpgb.png
- gbd 2.png
- srpg 2.png
- srp600.png
- patrol 803.png
- LC 100.png
- LC 102.png
- SMK 10.webp
- HT 10.webp
- MLT 10.png

### 5. Сирени (assets/sirens/)

Скопіюйте всю папку `assets/sirens/` з будь-якого проекту:

```bash
cp -r Nova_L_LTE_Culc.github.io/assets/sirens/* nova-calculators/assets/sirens/
```

Необхідні файли:
- dzhmil.png
- dzhmil-1.png

### 6. Шрифти (assets/fonts/)

Скопіюйте папку з шрифтом Neue Machina з будь-якого проекту:

```bash
cp -r Nova_L_LTE_Culc.github.io/assets/fonts/* nova-calculators/assets/fonts/
```

Необхідна структура:
```
assets/fonts/neu_machina/
├── NeueMachina-Regular.woff2
├── NeueMachina-Regular.woff
└── NeueMachina-Regular.ttf
```

### 7. Логотип TIRAS (assets/images/)

Скопіюйте логотип:

```bash
cp Nova_L_LTE_Culc.github.io/assets/tiras-logo.svg nova-calculators/assets/images/tiras-logo.svg
# або
cp Nova_L_LTE_Culc.github.io/assets/tiras_logo_w.png nova-calculators/assets/images/tiras-logo.svg
```

## Швидке копіювання всього

Якщо у вас є всі репозиторії в одній папці:

```bash
#!/bin/bash

# Створення структури папок
mkdir -p nova-calculators/assets/{boards,modules,kb,sensors,sirens,fonts,images}

# Копіювання плат
cp Nova_L_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-l-lte.png
cp Nova_M_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-m-lte.png
cp Nova_S_LTE_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-s-lte.png
cp Nova_L_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-l.png
cp Nova_M_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-m.png
cp Nova_S_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-s.png
cp Nova_XS_Culc.github.io/assets/board.png nova-calculators/assets/boards/nova-xs.png

# Копіювання всіх компонентів
cp -r Nova_L_LTE_Culc.github.io/assets/modules/* nova-calculators/assets/modules/
cp -r Nova_L_LTE_Culc.github.io/assets/kb/* nova-calculators/assets/kb/
cp -r Nova_L_LTE_Culc.github.io/assets/sensors/* nova-calculators/assets/sensors/
cp -r Nova_L_LTE_Culc.github.io/assets/sirens/* nova-calculators/assets/sirens/
cp -r Nova_L_LTE_Culc.github.io/assets/fonts/* nova-calculators/assets/fonts/
cp Nova_L_LTE_Culc.github.io/assets/tiras-logo.svg nova-calculators/assets/images/tiras-logo.svg

echo "Assets copied successfully!"
```

## Перевірка

Після копіювання переконайтеся, що всі файли на місці:

```bash
# Перевірка структури
ls -R nova-calculators/assets/

# Має показати всі папки та файли
```

## Важливо

1. Всі шляхи в JSON конфігураціях вказані відносно кореня проекту
2. В JavaScript всі зображення завантажуються з префіксом `../` (оскільки JS знаходиться в папці scripts/)
3. Переконайтеся що формати файлів співпадають (.png, .webp, .svg)
4. Назви файлів чутливі до регістру!
