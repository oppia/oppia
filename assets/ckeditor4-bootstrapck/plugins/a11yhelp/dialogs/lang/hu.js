/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.plugins.setLang('a11yhelp', 'hu', {
  title: 'Kisegítő utasítások',
  contents: 'Súgó tartalmak. A párbeszédablak bezárásához nyomjon ESC-et.',
  legend: [
    {
      name: 'Általános',
      items: [
        {
          name: 'Szerkesztő Eszköztár',
          legend:
            'Nyomjon ${toolbarFocus} hogy kijelölje az eszköztárat. A következő és előző eszköztár csoporthoz a TAB és SHIFT TAB-al juthat el. A következő és előző eszköztár gombhoz a BAL NYÍL vagy JOBB NYÍL gombbal juthat el. Nyomjon SPACE-t vagy ENTER-t hogy aktiválja az eszköztár gombot.',
        },

        {
          name: 'Szerkesző párbeszéd ablak',
          legend:
            'Párbeszédablakban nyomjon TAB-ot a következő párbeszédmezőhöz ugráshoz, nyomjon SHIFT + TAB-ot az előző mezőhöz ugráshoz, nyomjon ENTER-t a párbeszédablak elfogadásához, nyomjon ESC-et a párbeszédablak elvetéséhez. Azokhoz a párbeszédablakokhoz, amik több fület tartalmaznak, nyomjon ALT + F10-et hogy a fülekre ugorjon. Ezután a TAB-al vagy a JOBB NYÍLLAL a következő fülre ugorhat. Az előző fülre ugráshoz használja a SHIFT + TAB-ot vagy a BAL NYILAT. Nyomjon SPACE-t vagy ENTER-t hogy kijelölje a fület.',
        },

        {
          name: 'Szerkesztő helyi menü',
          legend:
            'Nyomjon ${contextMenu}-t vagy ALKALMAZÁS BILLENTYŰT a helyi menü megnyitásához. Ezután a következő menüpontra léphet a TAB vagy LEFELÉ NYÍLLAL. Az előző opciót a SHIFT+TAB vagy FELFELÉ NYÍLLAL érheti el. Nyomjon SPACE-t vagy ENTER-t a menüpont kiválasztásához. A jelenlegi menüpont almenüjének megnyitásához nyomjon SPACE-t vagy ENTER-t, vagy JOBB NYILAT. A főmenühöz való visszatéréshez nyomjon ESC-et vagy BAL NYILAT. A helyi menü bezárása az ESC billentyűvel lehetséges.',
        },

        {
          name: 'Szerkesztő lista',
          legend:
            'A listán belül a következő elemre a TAB vagy LEFELÉ NYÍLLAL mozoghat. Az előző elem kiválasztásához nyomjon SHIFT+TAB-ot vagy FELFELÉ NYILAT. Nyomjon SPACE-t vagy ENTER-t az elem kiválasztásához. Az ESC billentyű megnyomásával bezárhatja a listát.',
        },

        {
          name: 'Szerkesztő elem utak sáv',
          legend:
            'Nyomj ${elementsPathFocus} hogy kijelöld a elemek út sávját. A következő elem gombhoz a TAB-al vagy a JOBB NYÍLLAL juthatsz el. Az előző gombhoz a SHIFT+TAB vagy BAL NYÍLLAL mehetsz. A SPACE vagy ENTER billentyűvel kiválaszthatod az elemet a szerkesztőben.',
        },
      ],
    },
    {
      name: 'Parancsok',
      items: [
        {
          name: 'Parancs visszavonása',
          legend: 'Nyomj ${undo}',
        },
        {
          name: 'Parancs megismétlése',
          legend: 'Nyomjon ${redo}',
        },
        {
          name: 'Félkövér parancs',
          legend: 'Nyomjon ${bold}',
        },
        {
          name: 'Dőlt parancs',
          legend: 'Nyomjon ${italic}',
        },
        {
          name: 'Aláhúzott parancs',
          legend: 'Nyomjon ${underline}',
        },
        {
          name: 'Link parancs',
          legend: 'Nyomjon ${link}',
        },
        {
          name: 'Szerkesztősáv összecsukása parancs',
          legend: 'Nyomjon ${toolbarCollapse}',
        },
        {
          name: 'Hozzáférés az előző fókusz helyhez parancs',
          legend:
            'Nyomj ${accessNextSpace} hogy hozzáférj a legközelebbi elérhetetlen fókusz helyhez a hiányjel előtt, például: két szomszédos HR elemhez. Ismételd meg a billentyűkombinációt hogy megtaláld a távolabbi fókusz helyeket.',
        },
        {
          name: 'Hozzáférés a következő fókusz helyhez parancs',
          legend:
            'Nyomj ${accessNextSpace} hogy hozzáférj a legközelebbi elérhetetlen fókusz helyhez a hiányjel után, például: két szomszédos HR elemhez. Ismételd meg a billentyűkombinációt hogy megtaláld a távolabbi fókusz helyeket.',
        },
        {
          name: 'Kisegítő súgó',
          legend: 'Nyomjon ${a11yHelp}',
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
