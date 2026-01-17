// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for CK Editor.
 * NOTE: The way we show rich text components in CKEditor is by using Web
 * components. We don't create an angular view inside ckeditor. In our case,
 * the web components can't have the same selector as the angular component even
 * though they are literally the same component and use the same class. This is
 * because using the same selector is causing issues in the angular view as
 * angular creates a component instance and adds it to the view. When adding to
 * the view, it will also create a node with the selector we have specified.
 * Usually, this has no effect as there is no element in the web-browser
 * registered by the selector. But in our case, we did it to show rte components
 * in the ck-editor view.
 *
 * In order to overcome this situation, ck-editor uses the same component but we
 * register it with a different selector. The selector prefix is now
 * oppia-noninteractive-ckeditor-* instead of oppia-noninteractive we have for
 * the angular counterpart. This just an internal representation and the value
 * emitted to the parent component doesn't have oppia-noninteractive-ckeditor-*
 * tags, They have the normal oppia-noninteractive tags in them. Similarly, for
 * the value that's passed in, we don't expect oppia-noninteractive-ckeditor-*
 * tags. We expect the normal angular version of our tags and that is converted
 * on the fly.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  OnInit,
  ViewChild,
  Renderer2,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import {OppiaAngularRootComponent} from 'components/oppia-angular-root.component';
import {PageContextService} from 'services/page-context.service';
import {CkEditorCopyContentService} from './ck-editor-copy-content.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {Subscription} from 'rxjs';
import {
  RteHelperService,
  RteComponentSpecs,
} from './ck-editor-4-widgets.initializer';

interface UiConfig {
  rte_component_config_id: string;
  hide_complex_extensions: boolean;
  startupFocusEnabled?: boolean;
  language?: string;
  languageDirection?: string;
}

interface ExtendedCKEditorConfig extends CKEDITOR.config {
  rte_component_config_id?: string;
}
export interface RteConfig extends CKEDITOR.config {
  format_heading?: CKEDITOR.config.styleObject;
  format_normal?: CKEDITOR.config.styleObject;
  rte_component_config_id?: string;
}

@Component({
  selector: 'ck-editor-4-rte',
  templateUrl: './ck-editor-4-rte.component.html',
  styleUrls: [],
})
export class CkEditor4RteComponent
  implements AfterViewInit, OnChanges, OnDestroy, OnInit
{
  @Input() uiConfig!: UiConfig;
  @Input() value: string = '';
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  rteHelperService: RteHelperService;
  ck!: CKEDITOR.editor;
  currentValue: string = '';
  connectedToInternet = true;
  headersEnabled = false;
  windowIsNarrow = false;
  componentsThatRequireInternet: string[] = [];
  subscriptions: Subscription;
  componentRe = /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g;

  configError: string | null = null;
  pasteError: string | null = null;
  pendingPasteData: string | null = null;
  pendingPasteValidContent: string | null = null;
  showPasteConfirmation: boolean = false;

  @ViewChild('oppiaRTE') oppiaRTE!: ElementRef;

  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private pageContextService: PageContextService,
    private elementRef: ElementRef,
    private internetConnectivityService: InternetConnectivityService,
    private renderer: Renderer2
  ) {
    this.rteHelperService =
      OppiaAngularRootComponent.rteHelperService as unknown as RteHelperService;
    this.subscriptions = new Subscription();
  }

  ngOnInit(): void {
    this.validateConfiguration();
    this.subscriptions.add(
      this.internetConnectivityService.onInternetStateChange.subscribe(
        internetAccessible => {
          if (internetAccessible) {
            this.enableRTEicons();
            this.connectedToInternet = internetAccessible;
          } else {
            this.disableRTEicons();
            this.connectedToInternet = internetAccessible;
          }
        }
      )
    );
  }

  private validateConfiguration(): void {
    if (!this.uiConfig || !this.uiConfig.rte_component_config_id) {
      this.configError =
        'No component set specified. Please provide a "rte_component_config_id" config in uiConfig.';
      console.error('Error: ' + this.configError);
      return;
    }

    const rteComponents = this.uiConfig.rte_component_config_id;
    const componentList = (
      AppConstants.RTE_COMPONENT_CONFIGS as Record<string, readonly string[]>
    )[rteComponents];

    if (!componentList) {
      this.configError = `Component set "${rteComponents}" is not defined in AppConstants.RTE_COMPONENT_CONFIGS.`;
      console.error('Error: ' + this.configError);
      return;
    }
  }

  private validatePastedContent(content: string): {
    isValid: boolean;
    invalidComponents: string[];
    validContent: string;
    hasValidContent: boolean;
  } {
    if (this.configError || !content) {
      return {
        isValid: true,
        invalidComponents: [],
        validContent: content || '',
        hasValidContent: false,
      };
    }

    const invalidComponents: string[] = [];
    const {names: enabledComponents} = this.getEnabledComponents();
    let validContent = content;

    const componentMatches = Array.from(content.matchAll(this.componentRe));

    for (const match of componentMatches) {
      const componentParts = match[3];

      let componentName = componentParts;
      if (componentName.startsWith('ckeditor-')) {
        componentName = componentName.substring('ckeditor-'.length);
      }

      if (!enabledComponents.includes(componentName)) {
        if (!invalidComponents.includes(componentName)) {
          invalidComponents.push(componentName);
        }
        validContent = validContent.replace(match[0], '');
      }
    }

    validContent = validContent.replace(
      /<div[^>]*class="[^"]*oppia-rte-component-container[^"]*"[^>]*>\s*<\/div>/g,
      ''
    );

    validContent = validContent.replace(
      /<div[^>]*oppia-rte-component-container[^>]*>\s*<\/div>/g,
      ''
    );

    validContent = validContent.replace(/<p>\s*<\/p>/g, '');
    validContent = validContent.replace(/<div>\s*<\/div>/g, '');

    validContent = validContent
      .replace(/&nbsp;/g, ' ')
      .replace(/&zwsp;/g, '')
      .replace(/&#8203;/g, '')
      .replace(/&#x200B;/g, '')
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\u2060/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    validContent = validContent
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<div>\s*<\/div>/g, '')
      .replace(/<span>\s*<\/span>/g, '')
      .trim();

    const parser = new DOMParser();
    const doc = parser.parseFromString(validContent, 'text/html');
    let textOnlyContent = doc.body.textContent?.trim() ?? '';

    textOnlyContent = textOnlyContent
      .replace(/&nbsp;/g, ' ')
      .replace(/&zwsp;/g, '')
      .replace(/&#8203;/g, '')
      .replace(/&#x200B;/g, '')
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\u2060/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const hasMeaningfulContent = textOnlyContent.length > 0;
    const hasValidContent =
      invalidComponents.length > 0 && hasMeaningfulContent;

    return {
      isValid: invalidComponents.length === 0,
      invalidComponents,
      validContent,
      hasValidContent,
    };
  }

  private showPasteError(invalidComponents: string[]): void {
    const componentList = invalidComponents.join(', ');
    this.pasteError = `The following component${invalidComponents.length > 1 ? 's are' : ' is'} not supported in this editor: ${componentList}. Please do not add ${invalidComponents.length > 1 ? 'them' : 'it'} here.`;
    this.showPasteConfirmation = false;
    this.pendingPasteValidContent = null;
    console.warn(
      'Paste blocked due to invalid Rich-text editor components:',
      invalidComponents
    );
  }

  private showPasteConfirmationBox(
    invalidComponents: string[],
    validContent: string
  ): void {
    const componentList = invalidComponents.join(', ');
    this.pasteError = `The pasted content contains unsupported component${invalidComponents.length > 1 ? 's' : ''}: ${componentList}. Would you like to paste only the valid content?`;
    this.pendingPasteValidContent = validContent;
    this.showPasteConfirmation = true;
    console.warn(
      'Paste contains invalid components, asking user for confirmation:',
      invalidComponents
    );
  }

  private clearPasteError(): void {
    this.pasteError = null;
    this.showPasteConfirmation = false;
    this.pendingPasteData = null;
    this.pendingPasteValidContent = null;
  }

  getPasteError(): string | null {
    return this.pasteError;
  }

  shouldShowPasteConfirmation(): boolean {
    return this.showPasteConfirmation;
  }

  dismissPasteError(): void {
    this.clearPasteError();
  }

  confirmSelectivePaste(): void {
    if (this.pendingPasteValidContent && this.ck) {
      this.ck.insertHtml(this.pendingPasteValidContent);
      this.clearPasteError();

      setTimeout(() => {
        this.elementRef.nativeElement.dispatchEvent(new Event('change'));
      }, 0);
    }
  }

  rejectSelectivePaste(): void {
    this.clearPasteError();
    if (this.ck) {
      setTimeout(() => {
        this.ck.focus();
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.configError) {
      return;
    }
    if (this.currentValue === changes.value?.currentValue) {
      return;
    }

    let value = this.value ? this.value : '';
    value = value.replace(
      /<oppia-noninteractive-/g,
      '<oppia-noninteractive-ckeditor-'
    );
    value = value.replace(
      /<\/oppia-noninteractive-/g,
      '</oppia-noninteractive-ckeditor-'
    );
    this.value = value;
    if (this.ck && this.ck.status === 'ready' && changes.value) {
      this.ck.setData(this.wrapComponents(this.value));
    }
  }

  private _createCKEditorConfig(
    uiConfig: UiConfig,
    pluginNames: string,
    buttonNames: string[],
    extraAllowedContentRules: string,
    sharedSpaces: CKEDITOR.sharedSpace
  ): CKEDITOR.config {
    const ckConfig: RteConfig = {
      extraPlugins: 'pre,sharedspace,' + pluginNames,
      startupFocus: true,
      removePlugins: 'contextmenu,tabletools,tableselection,indentblock',
      title: false,
      floatSpaceDockedOffsetY: 15,
      extraAllowedContent: extraAllowedContentRules,
      forcePasteAsPlainText: true,
      sharedSpaces: sharedSpaces,
      skin:
        'bootstrapck,' +
        '/third_party/static/ckeditor-bootstrapck-1.0.0/skins/bootstrapck/',
      toolbar: [
        {
          name: 'basicstyles',
          items: ['Bold', '-', 'Italic'],
        },
        {
          name: 'paragraph',
          items: [
            'NumberedList',
            '-',
            'BulletedList',
            '-',
            'Pre',
            '-',
            'Blockquote',
            '-',
            'Indent',
            '-',
            'Outdent',
            'Format',
          ],
        },
        {
          name: 'rtecomponents',
          items: buttonNames,
        },
        {
          name: 'document',
          items: ['Source'],
        },
      ],
      format_tags: 'heading;normal',
      format_heading: {
        element: 'h1',
        name: 'Heading',
      },
      format_normal: {
        element: 'div',
        name: 'Normal',
      },
    };

    if (!uiConfig) {
      return ckConfig;
    }

    if (uiConfig.language) {
      ckConfig.language = uiConfig.language;
      ckConfig.contentsLanguage = uiConfig.language;
    }
    if (uiConfig.languageDirection) {
      ckConfig.contentsLangDirection = uiConfig.languageDirection;
    }
    if (uiConfig.startupFocusEnabled !== undefined) {
      ckConfig.startupFocus = uiConfig.startupFocusEnabled;
    }

    return ckConfig;
  }

  wrapComponents(html: string): string {
    if (html === undefined) {
      return html;
    }
    return html.replace(
      this.componentRe,
      (match: string, p1: string, p2: string, p3: string) => {
        let rteComponentName = p3.split('-')[1] || p3;

        if (this.rteHelperService.isInlineComponent(rteComponentName)) {
          return `<span type="oppia-noninteractive-${p3}">${match}</span>`;
        } else {
          return (
            '<div type="oppia-noninteractive-' +
            p3 +
            '"' +
            'class="oppia-rte-component-container">' +
            match +
            '</div>'
          );
        }
      }
    );
  }

  private getEnabledComponents(): {
    names: string[];
    icons: string[];
    componentsThatRequireInternet: string[];
  } {
    const _RICH_TEXT_COMPONENTS = this.rteHelperService.getRichTextComponents();
    const result: {
      names: string[];
      icons: string[];
      componentsThatRequireInternet: string[];
    } = {
      names: [],
      icons: [],
      componentsThatRequireInternet: [],
    };

    if (this.configError) {
      return result;
    }

    const rteComponents = this.uiConfig.rte_component_config_id;
    const componentList = (
      AppConstants.RTE_COMPONENT_CONFIGS as Record<string, readonly string[]>
    )[rteComponents];

    if (!componentList) {
      return result;
    }

    _RICH_TEXT_COMPONENTS.forEach((componentDefn: RteComponentSpecs) => {
      const isInComponentList = componentList.includes(componentDefn.id);

      const hideComplexExtensionFlag =
        this.uiConfig &&
        this.uiConfig.hide_complex_extensions &&
        componentDefn.isComplex;

      if (isInComponentList && !hideComplexExtensionFlag) {
        result.names.push(componentDefn.id);
        result.icons.push(componentDefn.iconDataUrl);
      }

      if (componentDefn.requiresInternet) {
        result.componentsThatRequireInternet.push(componentDefn.id);
      }
    });

    return result;
  }

  ngAfterViewInit(): void {
    if (this.configError) {
      return;
    }
    const {names, icons, componentsThatRequireInternet} =
      this.getEnabledComponents();
    this.componentsThatRequireInternet = componentsThatRequireInternet;

    var editable =
      this.elementRef.nativeElement.querySelectorAll('.oppia-rte-resizer');
    var resize = () => {
      editable.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, 'width', '100%');
      });
    };
    editable.forEach((element: HTMLElement) => {
      this.renderer.listen(element, 'change', resize);
      this.renderer.listen(element, 'click', resize);
    });

    var componentRule =
      names
        .map(name => {
          return 'oppia-noninteractive-ckeditor-' + name;
        })
        .join(' ') + '(*)[*];';
    var inlineWrapperRule = ' span[type];';
    var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
    var blockOverlayRule = ' div(oppia-rte-component-overlay);';
    var extraAllowedContentRules =
      componentRule + inlineWrapperRule + blockWrapperRule + blockOverlayRule;
    var pluginNames = names
      .map(name => {
        return 'oppia' + name;
      })
      .join(',');
    var buttonNames: string[] = [];
    if (this.pageContextService.canAddOrEditComponents()) {
      names.forEach(name => {
        buttonNames.push('Oppia' + name);
        buttonNames.push('-');
      });
    }
    buttonNames.pop();

    this.headersEnabled = this.pageContextService.isInBlogPostEditorPage();

    CKEDITOR.plugins.addExternal(
      'sharedspace',
      '/third_party/static/ckeditor-4.12.1/plugins/sharedspace/',
      'plugin.js'
    );
    CKEDITOR.plugins.addExternal(
      'pre',
      '/extensions/ckeditor_plugins/pre/',
      'plugin.js'
    );

    const sharedSpaces = {
      top: this.elementRef.nativeElement.children[0].children[0] as HTMLElement,
    };

    const ckConfig = this._createCKEditorConfig(
      this.uiConfig,
      pluginNames,
      buttonNames,
      extraAllowedContentRules,
      sharedSpaces
    ) as ExtendedCKEditorConfig;

    if (this.uiConfig && this.uiConfig.rte_component_config_id) {
      ckConfig.rte_component_config_id = this.uiConfig.rte_component_config_id;
    }

    var ck = CKEDITOR.inline(
      this.elementRef.nativeElement.children[0].children[1] as HTMLElement,
      ckConfig
    );

    this.elementRef.nativeElement.setAttribute('style', 'display: None');
    let loadingDiv = document.createElement('div');
    loadingDiv.innerText = 'Loading...';
    if (this.elementRef.nativeElement.parentElement) {
      this.elementRef.nativeElement.parentElement.appendChild(loadingDiv);
    }

    ck.on('instanceReady', () => {
      (this.elementRef.nativeElement as HTMLElement).setAttribute(
        'style',
        'display: block'
      );
      if (this.elementRef.nativeElement.parentElement) {
        this.elementRef.nativeElement.parentElement.removeChild(loadingDiv);
      }
      names.forEach((name, index) => {
        var icon = icons[index];
        var button = this.elementRef.nativeElement.querySelector(
          '.cke_button__oppia' + name
        );

        if (button) {
          this.renderer.setStyle(
            button,
            'background-image',
            `url("/extensions${icon}")`
          );
          this.renderer.setStyle(button, 'background-position', 'center');
          this.renderer.setStyle(button, 'background-repeat', 'no-repeat');
          this.renderer.setStyle(button, 'height', '24px');
          this.renderer.setStyle(button, 'width', '24px');
          this.renderer.setStyle(button, 'padding', '0px 0px');
        }
      });

      var separators = this.elementRef.nativeElement.querySelectorAll(
        '.cke_toolbar_separator'
      );
      separators.forEach((separator: HTMLElement) => {
        this.renderer.setStyle(separator, 'height', '22px');
      });

      const buttonIcons =
        this.elementRef.nativeElement.querySelectorAll('.cke_button_icon');

      buttonIcons.forEach((buttonIcon: HTMLElement) => {
        this.renderer.setStyle(buttonIcon, 'height', '24px');
        this.renderer.setStyle(buttonIcon, 'width', '24px');
      });

      var changeComboPanel = () => {
        var comboPanel =
          this.elementRef.nativeElement.querySelector('.cke_combopanel');
        if (comboPanel) {
          this.renderer.setStyle(comboPanel, 'height', '100px');
          this.renderer.setStyle(comboPanel, 'width', '120px');
        }
      };
      var comboButton =
        this.elementRef.nativeElement.querySelector('.cke_combo_button');
      if (comboButton) {
        this.renderer.setStyle(comboButton, 'height', '29px');
        this.renderer.setStyle(comboButton, 'width', '62px');
        this.renderer.setStyle(comboButton, 'margin-right', '25px');

        this.renderer.listen(comboButton, 'click', () => {
          setTimeout(() => changeComboPanel(), 25);
        });
      }

      var comboOpen =
        this.elementRef.nativeElement.querySelector('.cke_combo_open');
      if (comboOpen) {
        this.renderer.setStyle(comboOpen, 'margin-left', '-20px');
        this.renderer.setStyle(comboOpen, 'margin-top', '2px');
      }

      var comboText =
        this.elementRef.nativeElement.querySelector('.cke_combo_text');
      if (comboText) {
        this.renderer.setStyle(comboText, 'padding', '2px 5px 0px');
      }

      if (!this.headersEnabled) {
        const formatCombo =
          this.elementRef.nativeElement.querySelector('.cke_combo__format');
        if (formatCombo) {
          this.renderer.setStyle(formatCombo, 'display', 'none');
        }
      }

      if (!this.internetConnectivityService.isOnline()) {
        this.connectedToInternet = false;
        this.disableRTEicons();
      }
      ck.setData(this.wrapComponents(this.value));
    });

    ck.on(
      'paste',
      (event: CKEDITOR.eventInfo & {data: {dataValue: string}}) => {
        const pastedData = event.data.dataValue || '';
        const validation = this.validatePastedContent(pastedData);

        if (!validation.isValid) {
          event.cancel();

          if (validation.hasValidContent) {
            this.showPasteConfirmationBox(
              validation.invalidComponents,
              validation.validContent
            );
          } else {
            this.showPasteError(validation.invalidComponents);
          }

          setTimeout(() => {
            this.elementRef.nativeElement.dispatchEvent(new Event('change'));
          }, 0);

          setTimeout(() => {
            ck.focus();
          }, 100);
        } else {
          this.clearPasteError();
        }
      }
    );

    ck.on(
      'getSnapshot',
      (event: CKEDITOR.eventInfo & {data: string}) => {
        if (event.data === undefined) {
          return;
        }
        event.data = event.data.replace(
          this.componentRe,
          (match: string, p1: string, p2: string) => {
            return p1 + '</' + p2 + '>';
          }
        );
      },
      null,
      null,
      20
    );

    ck.on('change', () => {
      if (ck.getData() === this.value) {
        return;
      }

      this.clearPasteError();

      const parser = new DOMParser();
      const doc = parser.parseFromString(ck.getData(), 'text/html');
      const wrapperDiv = doc.body;

      const textElt = wrapperDiv.childNodes;

      for (let i = textElt.length; i > 0; i--) {
        const parent = textElt[i - 1];
        for (let j = parent.childNodes.length; j > 0; j--) {
          const node = parent.childNodes[j - 1];
          if (
            node.nodeName === 'BR' ||
            (node.nodeName === '#text' &&
              node.nodeValue &&
              node.nodeValue.trim() === '')
          ) {
            node.remove();
          } else {
            break;
          }
        }
        if (parent.childNodes.length === 0) {
          if (
            parent.nodeName === 'BR' ||
            (parent.nodeName === '#text' &&
              parent.nodeValue &&
              parent.nodeValue.trim() === '') ||
            parent.nodeName === 'P'
          ) {
            parent.remove();
            continue;
          }
        } else {
          break;
        }
      }
      const serializer = new XMLSerializer();
      let html = Array.from(wrapperDiv.childNodes)
        .map(node => serializer.serializeToString(node))
        .join('');
      this.value = html;
      html = html.replace(
        /<oppia-noninteractive-ckeditor-/g,
        '<oppia-noninteractive-'
      );
      html = html.replace(
        /<\/oppia-noninteractive-ckeditor-/g,
        '</oppia-noninteractive-'
      );
      this.valueChange.emit(html);
      this.currentValue = html;
    });
    ck.setData(this.value);
    this.ck = ck;
    this.ckEditorCopyContentService.bindPasteHandler(ck);
  }

  disableRTEicons(): void {
    if (this.configError) {
      return;
    }
    this.componentsThatRequireInternet.forEach(name => {
      let buttons = this.elementRef.nativeElement.getElementsByClassName(
        'cke_button__oppia' + name
      );
      for (let i = 0; i < buttons.length; i++) {
        (buttons[i] as HTMLElement).style.backgroundColor = '#cccccc';
        (buttons[i] as HTMLElement).style.pointerEvents = 'none';
      }
    });
  }

  enableRTEicons(): void {
    if (this.configError) {
      return;
    }
    this.componentsThatRequireInternet.forEach(name => {
      let buttons = this.elementRef.nativeElement.getElementsByClassName(
        'cke_button__oppia' + name
      );
      for (let i = 0; i < buttons.length; i++) {
        (buttons[i] as HTMLElement).style.backgroundColor = '';
        (buttons[i] as HTMLElement).style.pointerEvents = '';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.ck) {
      this.ck.destroy();
    }
    this.subscriptions.unsubscribe();
  }
}
