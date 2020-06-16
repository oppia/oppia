// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for copying ck editor content from an output view to an
 *               ck editor
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { IRootScopeService } from 'angular';

@Injectable({
  providedIn: 'root'
})
export class CkEditorCopyContentService {
  readonly COPY_EVENT = 'copy-element-to-translation-editor';

  /**
   * Traverses up and down element ancestors/descendants, searching for widget
   * tags
   * @param target {HTMLElement} target to copy
   */
  private _handleCopy(target: HTMLElement): {
      rootElement: HTMLElement,
      containedWidgetTagName?: string
  } {
    let containedWidgetTagName;
    let currentElement = target;

    while (
      currentElement.parentElement.tagName !== 'ANGULAR-HTML-BIND'
    ) {
      const currentTagName = currentElement.tagName.toLowerCase();
      if (currentTagName.includes('-noninteractive-')) {
        containedWidgetTagName = currentTagName;
      }
      currentElement = currentElement.parentElement;
    }

    let descendents = Array.from(target.childNodes);
    while (descendents.length !== 0) {
      let currentDescendent = descendents.shift();
      const currentTagName = currentDescendent.nodeName.toLowerCase();
      if (currentTagName.includes('-noninteractive-')) {
        containedWidgetTagName = currentTagName;
        break;
      }

      descendents = [
        ...descendents,
        ...Array.from(currentDescendent.childNodes)
      ];
    }

    return { rootElement: currentElement, containedWidgetTagName };
  }

  /**
   * Detects if element is to be copied as a widget or as a HTML element, and
   * inserts into editor
   * @param editor {CKEDITOR.editor} editor in which to
   *    create widget or insert HTML
   * @param element {HTMLElement} the element to be copied
   * @param containedWidgetTagName {string|undefined} the name of the widget
   *    in which element contains, if so
   */
  private _handlePaste(
      editor: CKEDITOR.editor,
      element: HTMLElement,
      containedWidgetTagName?: string
  ) {
    let tagName = (
      containedWidgetTagName || element.tagName.toLowerCase());
    let html = element.outerHTML;

    if (
      !containedWidgetTagName && !tagName.includes('-noninteractive-')
    ) {
      editor.insertHtml(html);
    } else {
      const widgetName = tagName.replace('-noninteractive-', '');
      const valueMatcher = /(\w+)(-with-value=")([^"]+)(")/g;
      let match;
      let startupData: {[id: string]: string} = {};

      while ((match = valueMatcher.exec(html)) !== null) {
        const key = match[1];
        const value = match[3];
        startupData[key] = value
          .replace(/&amp;quot;/g, '"')
          .replace('\\\\', '\\');

        if (widgetName !== 'oppiatabs') {
          startupData[key] = startupData[key]
            .substring(1, startupData[key].length - 1);
        }
      }

      if (widgetName === 'oppiatabs' && startupData.tab_contents) {
        editor.execCommand(
          widgetName,
          {startupData: {
            tab_contents: JSON.parse(startupData.tab_contents)
          }}
        );
      } else {
        editor.execCommand(widgetName, { startupData });
      }
    }
  }

  /**
   * Broadcasts to editor to copy target
   * @param contentScope {IRootScopeService} scope of parent containing editor
   * @param target {HTMLElement} element to copy
   */
  broadcastCopy(contentScope: IRootScopeService, target: HTMLElement) {
    const { rootElement, containedWidgetTagName } = this._handleCopy(target);

    contentScope.$broadcast(
      this.COPY_EVENT,
      rootElement,
      containedWidgetTagName
    );
  }

  /**
   * Binds editor and editor scope to listen for copy events
   * @param editorScope {IRootScopeService} scope to bind listener on to respond
   *    to copy event
   * @param editor {CKEDITOR.editor} editor to add copied content to
   */
  bindPasteHandler(
      editorScope: IRootScopeService,
      editor: CKEDITOR.editor,
  ) {
    editorScope.$on(
      this.COPY_EVENT,
      (_, element: HTMLElement, containedWidgetTagName?: string) =>
        this._handlePaste(editor, element, containedWidgetTagName)
    );
  }
}

angular.module('oppia').factory(
  'CkEditorCopyContentService',
  downgradeInjectable(CkEditorCopyContentService)
);
