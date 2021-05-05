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
 * @fileoverview Service for copying html content from an output view to an
 *               ck editor
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, EventEmitter } from '@angular/core';

import { HtmlEscaperService } from 'services/html-escaper.service';
import { Subscription } from 'rxjs';

interface CkEditorCopyEvent {
  rootElement?: HTMLElement;
  containedWidgetTagName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CkEditorCopyContentService {
  private readonly OUTPUT_VIEW_TAG_NAME = 'ANGULAR-HTML-BIND';
  private readonly NON_INTERACTIVE_TAG = '-noninteractive-';
  private readonly ALLOWLISTED_WIDGETS = new Set([
    'oppia-noninteractive-collapsible',
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-math',
    'oppia-noninteractive-tabs',
    'oppia-noninteractive-video',
    'oppia-noninteractive-skillreview'
  ]);

  private copyEventEmitter = new EventEmitter<CkEditorCopyEvent>();
  private ckEditorIdToSubscription: {[id: string]: Subscription} = {};

  copyModeActive = false;

  constructor(private htmlEscaperService: HtmlEscaperService) {}

  /**
   * Traverses up and down element ancestors/descendants, searching for widget
   * tags.
   * @param {HTMLElement} target The element target that contains or is a
   *  descendant of a widget, or a plain HTML element/group.
   * @returns {CkEditorCopyEvent} Returns an object of type CkEditorCopyEvent,
   *  where rootElement is the root ancestor of target and is
   *  always a child of angular-html-bind. containedWidgetTagName is the tag
   *  name of the widget if found in ancestors or descendants.
   */
  private _handleCopy(target: HTMLElement): CkEditorCopyEvent {
    let containedWidgetTagName;
    let currentElement = target;

    while (true) {
      const currentTagName = currentElement.tagName.toLowerCase();
      if (currentTagName.includes(this.NON_INTERACTIVE_TAG)) {
        containedWidgetTagName = currentTagName;
        break;
      }

      if (currentElement.parentElement.tagName === this.OUTPUT_VIEW_TAG_NAME) {
        break;
      }

      currentElement = currentElement.parentElement;
    }

    let descendants = Array.from(target.childNodes);
    while (descendants.length !== 0) {
      let currentDescendant = descendants.shift();
      const currentTagName = currentDescendant.nodeName.toLowerCase();
      if (currentTagName.includes(this.NON_INTERACTIVE_TAG)) {
        containedWidgetTagName = currentTagName;
        break;
      }

      descendants = [
        ...descendants,
        ...Array.from(currentDescendant.childNodes)
      ];
    }

    if (containedWidgetTagName &&
        !this.ALLOWLISTED_WIDGETS.has(containedWidgetTagName)) {
      return {};
    }

    return { rootElement: currentElement, containedWidgetTagName };
  }

  /**
   * Detects if element is to be copied as a widget or as a HTML element, and
   * inserts into editor.
   * @param {CKEDITOR.editor} editor The editor in which to create widget or
   *  insert HTML.
   * @param {HTMLElement} element The element to be copied.
   * @param {string|undefined} containedWidgetTagName The name of the widget
   *  in which element contains, if present.
   */
  private _handlePaste(
      editor: CKEDITOR.editor | Partial<CKEDITOR.editor>,
      element: HTMLElement,
      containedWidgetTagName: string | undefined
  ) {
    let elementTagName = (
      containedWidgetTagName || element.tagName.toLowerCase());
    let html = element.outerHTML;

    if (!containedWidgetTagName) {
      editor.insertHtml(html);
    } else {
      const widgetName = elementTagName.replace('-noninteractive-', '');

      // Look for x-with-value="y" to extract x and y.
      //  Group 1 (\w+): Any word containing [a-zA-Z0-9_] characters. This is
      //    the name of the property.
      //  Group 2 (-with-value="): Matches characters literally.
      //  Group 3 ([^"]+): Matches any characters excluding ". This is the
      //    value of the property.
      //  Group 4 ("): Matches " literally.
      const valueMatcher = /(\w+)(-with-value=")([^"]+)(")/g;

      let match;
      let startupData: {[id: string]: string} = {};

      while ((match = valueMatcher.exec(html)) !== null) {
        const key = match[1];
        // Must replace & for html escaper to properly work- html escaper
        // service depends on & already escaped.
        const value = match[3].replace(/&amp;/g, '&');

        startupData[key] = JSON.parse(
          this.htmlEscaperService.escapedStrToUnescapedStr(value));
      }

      editor.execCommand(widgetName, { startupData });
    }
  }

  toggleCopyMode(): void {
    this.copyModeActive = !this.copyModeActive;
  }

  /**
   * Broadcasts to subject to copy target.
   * @param {HTMLElement} target The element to copy.
   */
  broadcastCopy(target: HTMLElement): void {
    if (!this.copyModeActive) {
      return;
    }

    this.copyEventEmitter.emit(
      this._handleCopy(target)
    );
  }

  /**
   * Binds ckeditor to subject.
   * @param {CKEDITOR.editor} editor The editor to add copied content to.
   */
  bindPasteHandler(
      editor: CKEDITOR.editor | Partial<CKEDITOR.editor>
  ): void {
    this.ckEditorIdToSubscription[editor.id] = this.copyEventEmitter.subscribe(
      ({rootElement, containedWidgetTagName}: CkEditorCopyEvent) => {
        if (!rootElement) {
          return;
        }
        if (editor.status === 'destroyed') {
          this.ckEditorIdToSubscription[editor.id].unsubscribe();
          delete this.ckEditorIdToSubscription[editor.id];
          return;
        }
        this._handlePaste(
          editor, rootElement, containedWidgetTagName);
      }
    );
  }
}

angular.module('oppia').factory(
  'CkEditorCopyContentService',
  downgradeInjectable(CkEditorCopyContentService)
);
