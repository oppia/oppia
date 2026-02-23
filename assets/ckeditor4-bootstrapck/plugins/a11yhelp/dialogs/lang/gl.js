/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.setLang('a11yhelp', 'gl', {
  title: 'Instrucións de accesibilidade',
  contents: 'Axuda. Para pechar este diálogo prema ESC.',
  legend: [
    {
      name: 'Xeral',
      items: [
        {
          name: 'Barra de ferramentas do editor',
          legend:
            'Prema ${toolbarFocus} para navegar pola barra de ferramentas. Para moverse polos distintos grupos de ferramentas use as teclas TAB e MAIÚS+TAB. Para moverse polas distintas ferramentas use FRECHA DEREITA ou FRECHA ESQUERDA. Prema ESPAZO ou INTRO para activar o botón da barra de ferramentas.',
        },

        {
          name: 'Editor de diálogo',
          legend:
            'Dentro dun cadro de diálogo, prema a tecla TAB para desprazarse ao campo seguinte do cadro de diálogo, prema MAIÚS + TAB para desprazarse ao campo anterior, prema INTRO para presentar o cadro de diálogo, prema a tecla ESC para cancelar o diálogo. Para os diálogos que teñen varias páxinas, prema ALT + F10 para navegar á lapela da lista. Despois pasar á seguinte lapela con TAB ou FRECHA DEREITA. Para ir á lapela anterior con SHIFT + TAB ou FRECHA ESQUERDA. Prema ESPAZO ou INTRO para seleccionar a lapela da páxina.',
        },

        {
          name: 'Editor do menú contextual',
          legend:
            'Prema ${contextMenu} ou a TECLA MENÚ para abrir o menú contextual. A seguir móvase á seguinte opción do menú con TAB ou FRECHA ABAIXO. Móvase á opción anterior con MAIÚS + TAB ou FRECHA ARRIBA. Prema ESPAZO ou INTRO para seleccionar a opción do menú. Abra o submenú da opción actual con ESPAZO ou INTRO ou FRECHA DEREITA. Regrese ao elemento principal do menú con ESC ou FRECHA ESQUERDA. Peche o menú contextual con ESC.',
        },

        {
          name: 'Lista do editor',
          legend:
            'Dentro dunha lista, móvase ao seguinte elemento da lista con TAB ou FRECHA ABAIXO. Móvase ao elemento anterior da lista con MAIÚS + TAB ou FRECHA ARRIBA. Prema ESPAZO ou INTRO para escoller a opción da lista. Prema ESC para pechar a lista.',
        },

        {
          name: 'Barra da ruta ao elemento no editor',
          legend:
            'Prema ${elementsPathFocus} para navegar ata os elementos da barra de ruta. Móvase ao seguinte elemento botón con TAB ou FRECHA DEREITA. Móvase ao botón anterior con MAIÚS + TAB ou FRECHA ESQUERDA. Prema ESPAZO ou INTRO para seleccionar o elemento no editor.',
        },
      ],
    },
    {
      name: 'Ordes',
      items: [
        {
          name: 'Orde «desfacer»',
          legend: 'Prema ${undo}',
        },
        {
          name: 'Orde «refacer»',
          legend: 'Prema ${redo}',
        },
        {
          name: 'Orde «negra»',
          legend: 'Prema ${bold}',
        },
        {
          name: 'Orde «cursiva»',
          legend: 'Prema ${italic}',
        },
        {
          name: 'Orde «subliñar»',
          legend: 'Prema ${underline}',
        },
        {
          name: 'Orde «ligazón»',
          legend: 'Prema ${link}',
        },
        {
          name: 'Orde «contraer a barra de ferramentas»',
          legend: 'Prema ${toolbarCollapse}',
        },
        {
          name: 'Orde «acceder ao anterior espazo en foco»',
          legend:
            'Prema ${accessPreviousSpace} para acceder ao espazo máis próximo de foco inalcanzábel anterior ao cursor, por exemplo: dous elementos HR adxacentes. Repita a combinación de teclas para chegar a espazos de foco distantes.',
        },
        {
          name: 'Orde «acceder ao seguinte espazo en foco»',
          legend:
            'Prema ${accessNextSpace} para acceder ao espazo máis próximo de foco inalcanzábel posterior ao cursor, por exemplo: dous elementos HR adxacentes. Repita a combinación de teclas para chegar a espazos de foco distantes.',
        },
        {
          name: 'Axuda da accesibilidade',
          legend: 'Prema ${a11yHelp}',
        },
      ],
    },
  ],
  backspace: 'Backspace', // MISSING
  tab: 'Tab', // MISSING
  enter: 'Enter', // MISSING
  shift: 'Shift', // MISSING
  ctrl: 'Ctrl', // MISSING
  alt: 'Alt', // MISSING
  pause: 'Pause', // MISSING
  capslock: 'Caps Lock', // MISSING
  escape: 'Escape', // MISSING
  pageUp: 'Page Up', // MISSING
  pageDown: 'Page Down', // MISSING
  end: 'End', // MISSING
  home: 'Home', // MISSING
  leftArrow: 'Left Arrow', // MISSING
  upArrow: 'Up Arrow', // MISSING
  rightArrow: 'Right Arrow', // MISSING
  downArrow: 'Down Arrow', // MISSING
  insert: 'Insert', // MISSING
  delete: 'Delete', // MISSING
  leftWindowKey: 'Left Windows key', // MISSING
  rightWindowKey: 'Right Windows key', // MISSING
  selectKey: 'Select key', // MISSING
  numpad0: 'Numpad 0', // MISSING
  numpad1: 'Numpad 1', // MISSING
  numpad2: 'Numpad 2', // MISSING
  numpad3: 'Numpad 3', // MISSING
  numpad4: 'Numpad 4', // MISSING
  numpad5: 'Numpad 5', // MISSING
  numpad6: 'Numpad 6', // MISSING
  numpad7: 'Numpad 7', // MISSING
  numpad8: 'Numpad 8', // MISSING
  numpad9: 'Numpad 9', // MISSING
  multiply: 'Multiply', // MISSING
  add: 'Add', // MISSING
  subtract: 'Subtract', // MISSING
  decimalPoint: 'Decimal Point', // MISSING
  divide: 'Divide', // MISSING
  f1: 'F1', // MISSING
  f2: 'F2', // MISSING
  f3: 'F3', // MISSING
  f4: 'F4', // MISSING
  f5: 'F5', // MISSING
  f6: 'F6', // MISSING
  f7: 'F7', // MISSING
  f8: 'F8', // MISSING
  f9: 'F9', // MISSING
  f10: 'F10', // MISSING
  f11: 'F11', // MISSING
  f12: 'F12', // MISSING
  numLock: 'Num Lock', // MISSING
  scrollLock: 'Scroll Lock', // MISSING
  semiColon: 'Semicolon', // MISSING
  equalSign: 'Equal Sign', // MISSING
  comma: 'Comma', // MISSING
  dash: 'Dash', // MISSING
  period: 'Period', // MISSING
  forwardSlash: 'Forward Slash', // MISSING
  graveAccent: 'Grave Accent', // MISSING
  openBracket: 'Open Bracket', // MISSING
  backSlash: 'Backslash', // MISSING
  closeBracket: 'Close Bracket', // MISSING
  singleQuote: 'Single Quote', // MISSING
});
