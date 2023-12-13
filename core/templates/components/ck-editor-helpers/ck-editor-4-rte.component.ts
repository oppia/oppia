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

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, OnInit, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { ContextService } from 'services/context.service';
import { CkEditorCopyContentService } from './ck-editor-copy-content.service';
import { InternetConnectivityService } from 'services/internet-connectivity.service';
import { RteComponentSpecs } from './ck-editor-4-widgets.initializer';
import { Subscription } from 'rxjs';

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
  templateUrl: './ck-editor-4-rte.component.html',
  styleUrls: []
})
export class CkEditor4RteComponent implements AfterViewInit, OnChanges,
    OnDestroy, OnInit {
  @Input() uiConfig: UiConfig;
  @Input() value;
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  rteHelperService;
  ck: CKEDITOR.editor;
  currentValue: string;
  connectedToInternet = true;
  headersEnabled = false;
  windowIsNarrow = false;
  componentsThatRequireInternet: string[] = [];
  subscriptions: Subscription;
  // A RegExp for matching rich text components.
  componentRe = (
    /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
  );

  @ViewChild('oppiaRTE') oppiaRTE: ElementRef;

  constructor(
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private contextService: ContextService,
    private elementRef: ElementRef,
    private internetConnectivityService: InternetConnectivityService
  ) {
    this.rteHelperService = OppiaAngularRootComponent.rteHelperService;
    this.subscriptions = new Subscription();
  }

  ngOnInit(): void {
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
        }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Ckeditor 'change' event gets triggered when a user types. In the
    // change listener, value is set and it triggers the ngOnChanges
    // lifecycle hook. This cannot be avoided so we check if the currentValue
    // is the same as the detected change passed to ngOnChanges. If so, return.
    if (this.currentValue === changes.value?.currentValue) {
      return;
    }
    // If ngOnChanges is called first, it means that the input 'value' to
    // this component has changed without a user manually typing something.
    // In such cases, call ck.setData() to update ckeditor with the latest
    // input value. This can happen, for example, if there exists a list of
    // ck-editor-4-rte components on a page, and the list is reordered or
    // certain elements are deleted, then the values passed to the individual
    // components may change without re-rendering each of the components,
    // in such cases, it is sufficient to update the ckeditor instance manually
    // with the latest value.

    // Angular lifecycle methods on NgModel write null to the value property.
    // Initializing this properly won't work as Angular will overwrite the
    // value after it has been initialized.
    // Since string methods are used on value variable, so it can't be null or
    // undefined. When we move to reactive forms, this won't be a problem.
    // TODO(#15458): Change the ternary statement to "let value = this.value".
    let value = this.value ? this.value : '';
    // Refer to the note at the top of the file for the reason behind replace.
    value = value.replace(
      /<oppia-noninteractive-/g,
      '<oppia-noninteractive-ckeditor-'
    );
    // Refer to the note at the top of the file for the reason behind replace.
    value = value.replace(
      /<\/oppia-noninteractive-/g,
      '</oppia-noninteractive-ckeditor-'
    );
    this.value = value;
    if (this.ck && this.ck.status === 'ready' && changes.value) {
      this.ck.setData(this.wrapComponents(this.value));
    }
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
      removePlugins: 'contextmenu,tabletools,tableselection,indentblock',
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

  /**
   * Before data is loaded into CKEditor, we need to wrap every rte
   * component in a span (inline) or div (block).
   * For block elements, we add an overlay div as well.
   */
  wrapComponents(html: string): string {
    if (html === undefined) {
      return html;
    }
    return html.replace(this.componentRe, (match, p1, p2, p3) => {
      // Here we remove the 'ckeditor' part of the string p3 to get the name
      // of the RTE Component.
      let rteComponentName = p3.split('-')[1];

      if (this.rteHelperService.isInlineComponent(rteComponentName)) {
        return `<span type="oppia-noninteractive-${p3}">${match}</span>`;
      } else {
        return (
          '<div type="oppia-noninteractive-' + p3 + '"' +
          'class="oppia-rte-component-container">' + match +
          '</div>');
      }
    });
  }

  ngAfterViewInit(): void {
    var _RICH_TEXT_COMPONENTS = this.rteHelperService.getRichTextComponents();
    var names = [];
    var icons = [];
    this.componentsThatRequireInternet = [];

    _RICH_TEXT_COMPONENTS.forEach((componentDefn) => {
      var hideComplexExtensionFlag = (
        this.uiConfig &&
              this.uiConfig.hide_complex_extensions &&
              componentDefn.isComplex);
      var notSupportedOnAndroidFlag = (
        this.contextService.isExplorationLinkedToStory() &&
              AppConstants.VALID_RTE_COMPONENTS_FOR_ANDROID.indexOf(
                componentDefn.id) === -1);
      if (!(
        hideComplexExtensionFlag ||
        notSupportedOnAndroidFlag ||
        this.isInvalidForBlogPostEditorRTE(componentDefn)
      )) {
        names.push(componentDefn.id);
        icons.push(componentDefn.iconDataUrl);
      }
      if (componentDefn.requiresInternet) {
        this.componentsThatRequireInternet.push(componentDefn.id);
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
      (editable[i] as HTMLElement).onchange = () => {
        resize();
      };
      (editable[i] as HTMLElement).onclick = () => {
        resize();
      };
    }

    /**
       * Create rules to allow all the rich text components and
       * their wrappers and overlays.
       * See format of filtering rules here:
       * http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
       */
    // Allow the component tags with any attributes and classes.
    var componentRule = names.map((name) => {
      return 'oppia-noninteractive-ckeditor-' + name;
    }).join(' ') + '(*)[*];';
      // Allow the inline component wrapper, which is a
      // span with a "type" attribute.
    var inlineWrapperRule = ' span[type];';
    // Allow the block component wrapper, which is a div
    // with a "type" attribute and a CSS class.
    var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
    // Allow the transparent block component overlay, which is
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

    // Enable format headers in CKE editor for blog post editor rte.
    this.headersEnabled = this.contextService.isInBlogPostEditorPage();

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
        this.elementRef.nativeElement.children[0].children[0] as HTMLElement)
    };

    const ckConfig = this._createCKEditorConfig(
      this.uiConfig, pluginNames, buttonNames, extraAllowedContentRules,
      sharedSpaces);

    // Initialize CKEditor.
    var ck = CKEDITOR.inline(
      (
        this.elementRef.nativeElement.children[0].children[1] as HTMLElement
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

    ck.on('instanceReady', () => {
      // Show the editor now that it is fully loaded.
      (
        this.elementRef.nativeElement as HTMLElement
      ).setAttribute('style', 'display: block');
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
        .css('margin-right', '25px')
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
        $('.cke_combo__format')
          .css('display', 'none');
      }

      if (!this.internetConnectivityService.isOnline()) {
        this.connectedToInternet = false;
        this.disableRTEicons();
      }
      ck.setData(this.wrapComponents(this.value));
    });

    // Angular rendering of components confuses CKEditor's undo system, so
    // we hide all of that stuff away from CKEditor.
    ck.on('getSnapshot', (event) => {
      if (event.data === undefined) {
        return;
      }
      event.data = event.data.replace(this.componentRe, (match, p1, p2) => {
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
      let html = elt.html();
      this.value = html;
      // Refer to the note at the top of the file for the reason behind replace.
      html = html.replace(
        /<oppia-noninteractive-ckeditor-/g,
        '<oppia-noninteractive-'
      );
      // Refer to the note at the top of the file for the reason behind replace.
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
    // Add disabled cursor pointer to the icons.
    this.componentsThatRequireInternet.forEach((name) => {
      let buttons = this.elementRef.nativeElement.getElementsByClassName(
        'cke_button__oppia' + name);
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.backgroundColor = '#cccccc';
        buttons[i].style.pointerEvents = 'none';
      }
    });
  }

  enableRTEicons(): void {
    this.componentsThatRequireInternet.forEach((name) => {
      let buttons = this.elementRef.nativeElement.getElementsByClassName(
        'cke_button__oppia' + name);
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.backgroundColor = '';
        buttons[i].style.pointerEvents = '';
      }
    });
  }

  // Returns whether the component should be shown in the 'Blog Post Editor
  // RTE'. Return true if component should be hidden in the RTE.
  isInvalidForBlogPostEditorRTE(compDefn: RteComponentSpecs): boolean {
    let invalidComponents = (
      AppConstants.INVALID_RTE_COMPONENTS_FOR_BLOG_POST_EDITOR);
    return (
      this.contextService.isInBlogPostEditorPage() && (
        invalidComponents.some(
          (invalidComponents) => invalidComponents === compDefn.id
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.ck.destroy();
    this.subscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('ckEditor4Rte', downgradeComponent({
  component: CkEditor4RteComponent
}));
