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
 */

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { ContextService } from 'services/context.service';
import { CkEditorCopyContentService } from './ck-editor-copy-content.service';

interface UiConfig {
  (): UiConfig;
  'hide_complex_extensions': boolean;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}

interface RteConfig extends CKEDITOR.config {
  'format_heading'?: CKEDITOR.config.styleObject;
  'format_normal'?: CKEDITOR.config.styleObject;
}

@Component({
  selector: 'ck-editor-4-rte',
  template: '<div><div></div>' +
            '<div contenteditable="true" ' +
            'class="oppia-rte-resizer oppia-rte protractor-test-rte">' +
            '</div></div>',
  styleUrls: []
})
export class CkEditor4RteComponent implements AfterViewInit, OnDestroy {
  @Input() uiConfig: UiConfig;
  @Input() value;
  @Input() headersEnabled = false;
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  rteHelperService;
  ck: CKEDITOR.editor;
  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private contextService: ContextService,
    private elementRef: ElementRef
  ) {
    this.rteHelperService = OppiaAngularRootComponent.rteHelperService;
  }

  /**
   * Creates a CKEditor configuration.
   * @param config CKEditor config to add to
   * @param uiConfig Parameters to add to CKEditor config
   * @param pluginNames Comma separated list of plugin names
   * @param buttonNames Array of button names for RTE components
   * @param extraAllowedContentRules Additional allowed content rules for
   * CKEDITOR.editor.filter
   * @param sharedSpaces IDs of the page elements that will store the editor
   * UI elements
   */
  private _createCKEditorConfig(
      uiConfig: UiConfig,
      pluginNames: string,
      buttonNames: string[],
      extraAllowedContentRules: string,
      sharedSpaces: CKEDITOR.sharedSpace
  ): CKEDITOR.config {
    // Language configs use default language when undefined.
    const ckConfig: RteConfig = {
      extraPlugins: 'pre,sharedspace,' + pluginNames,
      startupFocus: true,
      removePlugins: 'indentblock',
      title: false,
      floatSpaceDockedOffsetY: 15,
      extraAllowedContent: extraAllowedContentRules,
      forcePasteAsPlainText: true,
      sharedSpaces: sharedSpaces,
      skin: (
        'bootstrapck,' +
      '/third_party/static/ckeditor-bootstrapck-1.0.0/skins/bootstrapck/'
      ),
      toolbar: [
        {
          name: 'basicstyles',
          items: ['Bold', '-', 'Italic']
        },
        {
          name: 'paragraph',
          items: [
            'NumberedList', '-',
            'BulletedList', '-',
            'Pre', '-',
            'Blockquote', '-',
            'Indent', '-',
            'Outdent',
            'Format',
          ]
        },
        {
          name: 'rtecomponents',
          items: buttonNames
        },
        {
          name: 'document',
          items: ['Source']
        }
      ],
      format_tags: 'heading;normal',
      format_heading: {
        element: 'h1',
        name: 'Heading'
      },
      format_normal: {
        element: 'div',
        name: 'Normal'
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
      ckConfig.contentsLangDirection = (
        uiConfig.languageDirection);
    }
    if (uiConfig.startupFocusEnabled !== undefined) {
      ckConfig.startupFocus = uiConfig.startupFocusEnabled;
    }

    return ckConfig;
  }

  ngAfterViewInit(): void {
    var _RICH_TEXT_COMPONENTS = this.rteHelperService.getRichTextComponents();
    var names = [];
    var icons = [];

    _RICH_TEXT_COMPONENTS.forEach((componentDefn) => {
      var hideComplexExtensionFlag = (
        this.uiConfig &&
              this.uiConfig.hide_complex_extensions &&
              componentDefn.isComplex);
      var notSupportedOnAndroidFlag = (
        this.contextService.isExplorationLinkedToStory() &&
              AppConstants.VALID_RTE_COMPONENTS_FOR_ANDROID.indexOf(
                componentDefn.id) === -1);
      if (!(hideComplexExtensionFlag || notSupportedOnAndroidFlag)) {
        names.push(componentDefn.id);
        icons.push(componentDefn.iconDataUrl);
      }
    });

    var editable = document.querySelectorAll('.oppia-rte-resizer');
    var resize = () => {
      // TODO(#12882): Remove the use of jQuery.
      $('.oppia-rte-resizer').css({
        width: '100%'
      });
    };
    for (let i of Object.keys(editable)) {
      (<HTMLElement>editable[i]).onchange = () => {
        resize();
      };
      (<HTMLElement>editable[i]).onclick = () => {
        resize();
      };
    }

    /**
       * Create rules to whitelist all the rich text components and
       * their wrappers and overlays.
       * See format of filtering rules here:
       * http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
       */
    // Whitelist the component tags with any attributes and classes.
    var componentRule = names.map((name) => {
      return 'oppia-noninteractive-' + name;
    }).join(' ') + '(*)[*];';
      // Whitelist the inline component wrapper, which is a
      // span with a "type" attribute.
    var inlineWrapperRule = ' span[type];';
    // Whitelist the block component wrapper, which is a div
    // with a "type" attribute and a CSS class.
    var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
    // Whitelist the transparent block component overlay, which is
    // a div with a CSS class.
    var blockOverlayRule = ' div(oppia-rte-component-overlay);';
    // Put all the rules together.
    var extraAllowedContentRules = componentRule +
                                         inlineWrapperRule +
                                         blockWrapperRule +
                                         blockOverlayRule;
    var pluginNames = names.map((name) => {
      return 'oppia' + name;
    }).join(',');
    var buttonNames = [];
    if (this.contextService.canAddOrEditComponents()) {
      names.forEach((name) => {
        buttonNames.push('Oppia' + name);
        buttonNames.push('-');
      });
    }
    buttonNames.pop();

    // Add external plugins.
    CKEDITOR.plugins.addExternal(
      'sharedspace',
      '/third_party/static/ckeditor-4.12.1/plugins/sharedspace/',
      'plugin.js');
    // Pre plugin is not available for 4.12.1 version of CKEditor. This is
    // a self created plugin (other plugins are provided by CKEditor).
    CKEDITOR.plugins.addExternal(
      'pre', '/extensions/ckeditor_plugins/pre/', 'plugin.js');

    const sharedSpaces = {
      top: (
          <HTMLElement> this.elementRef.nativeElement.children[0].children[0])
    };

    const ckConfig = this._createCKEditorConfig(
      this.uiConfig, pluginNames, buttonNames, extraAllowedContentRules,
      sharedSpaces);

    // Initialize CKEditor.
    var ck = CKEDITOR.inline(
            <HTMLElement>(
              this.elementRef.nativeElement.children[0].children[1]
              ),
            ckConfig
    );

    // Hide the editor until it is fully loaded after `instanceReady`
    // is fired. This sets the style for `ck-editor-4-rte`.
    this.elementRef.nativeElement.setAttribute('style', 'display: None');
    // Show the loading text.
    let loadingDiv = document.createElement('div');
    loadingDiv.innerText = 'Loading...';
    // This div is placed as a child of `schema-based-editor`.
    this.elementRef.nativeElement.parentElement.appendChild(loadingDiv);

    // A RegExp for matching rich text components.
    var componentRe = (
      /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
    );

    /**
       * Before data is loaded into CKEditor, we need to wrap every rte
       * component in a span (inline) or div (block).
       * For block elements, we add an overlay div as well.
       */
    var wrapComponents = (html) => {
      if (html === undefined) {
        return html;
      }
      return html.replace(componentRe, (match, p1, p2, p3) => {
        if (this.rteHelperService.isInlineComponent(p3)) {
          return '<span type="oppia-noninteractive-' + p3 + '">' +
                      match + '</span>';
        } else {
          return '<div type="oppia-noninteractive-' + p3 + '"' +
                       'class="oppia-rte-component-container">' + match +
                       '</div>';
        }
      });
    };

    ck.on('instanceReady', () => {
      // Show the editor now that it is fully loaded.
      (
        <HTMLElement> this.elementRef.nativeElement
      ).setAttribute('style', 'display: block');
      // Focus on the CK editor text box.
      (
        <HTMLElement> this.elementRef.nativeElement.children[0].children[1]
      ).focus();
      // Remove the loading text.
      this.elementRef.nativeElement.parentElement.removeChild(loadingDiv);
      // Set the css and icons for each toolbar button.
      names.forEach((name, index) => {
        var icon = icons[index];
        // TODO(#12882): Remove the use of jQuery.
        $('.cke_button__oppia' + name)
          .css('background-image', 'url("/extensions' + icon + '")')
          .css('background-position', 'center')
          .css('background-repeat', 'no-repeat')
          .css('height', '24px')
          .css('width', '24px')
          .css('padding', '0px 0px');
      });

      // TODO(#12882): Remove the use of jQuery.
      $('.cke_toolbar_separator')
        .css('height', '22px');

      // TODO(#12882): Remove the use of jQuery.
      $('.cke_button_icon')
        .css('height', '24px')
        .css('width', '24px');

      var changeComboPanel = () => {
        // TODO(#12882): Remove the use of jQuery.
        $('.cke_combopanel')
          .css('height', '100px')
          .css('width', '120px');
      };

      // TODO(#12882): Remove the use of jQuery.
      $('.cke_combo_button')
        .css('height', '29px')
        .css('width', '62px')
        .on('click', () => {
          // Timeout is required to ensure that the format dropdown
          // has been initialized and the iframe has been loaded into DOM.
          setTimeout(() => changeComboPanel(), 25);
        });

      // TODO(#12882): Remove the use of jQuery.
      $('.cke_combo_open')
        .css('margin-left', '-20px')
        .css('margin-top', '2px');

      // TODO(#12882): Remove the use of jQuery.
      $('.cke_combo_text')
        .css('padding', '2px 5px 0px');

      if (!this.headersEnabled) {
        // TODO(#12882): Remove the use of jQuery.
        $('.cke_combo_button')
          .css('display', 'none');
      }

      ck.setData(wrapComponents(this.value));
    });

    // Angular rendering of components confuses CKEditor's undo system, so
    // we hide all of that stuff away from CKEditor.
    ck.on('getSnapshot', (event) => {
      if (event.data === undefined) {
        return;
      }
      event.data = event.data.replace(componentRe, (match, p1, p2) => {
        return p1 + '</' + p2 + '>';
      });
    }, null, null, 20);

    ck.on('change', () => {
      if (ck.getData() === this.value) {
        return;
      }

      // TODO(#12882): Remove the use of jQuery.
      var elt = $('<div>' + ck.getData() + '</div>');
      var textElt = elt[0].childNodes;
      for (var i = textElt.length; i > 0; i--) {
        for (var j = textElt[i - 1].childNodes.length; j > 0; j--) {
          if (textElt[i - 1].childNodes[j - 1].nodeName === 'BR' ||
                  (textElt[i - 1].childNodes[j - 1].nodeName === '#text' &&
                    textElt[i - 1].childNodes[j - 1].nodeValue.trim() === '')) {
            textElt[i - 1].childNodes[j - 1].remove();
          } else {
            break;
          }
        }
        if (textElt[i - 1].childNodes.length === 0) {
          if (textElt[i - 1].nodeName === 'BR' ||
                  (textElt[i - 1].nodeName === '#text' &&
                    textElt[i - 1].nodeValue.trim() === '') ||
                    textElt[i - 1].nodeName === 'P') {
            textElt[i - 1].remove();
            continue;
          }
        } else {
          break;
        }
      }
      this.valueChange.emit(elt.html());
      this.value = elt.html();
    });
    ck.setData(this.value);
    this.ck = ck;
    this.ckEditorCopyContentService.bindPasteHandler(ck);
  }

  ngOnDestroy(): void {
    this.ck.destroy();
  }
}

angular.module('oppia').directive('ckEditor4Rte', downgradeComponent({
  component: CkEditor4RteComponent
}));
