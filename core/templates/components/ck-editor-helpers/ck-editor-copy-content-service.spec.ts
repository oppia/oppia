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

import { CkEditorCopyContentService } from
  'components/ck-editor-helpers/ck-editor-copy-content-service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { LoggerService } from 'services/contextual/logger.service';

/**
 * Returns a HTMLElement containing the element to copy.
 * @param {string} html The hmtl to place in angular-html-bind element.
 * @returns {HTMLElement} The element created by param html.
 */
const generateContent = (html: string): HTMLElement => {
  const container = document.createElement('template');
  container.innerHTML = `<angular-html-bind>${html.trim()}</angular-html-bind>`;
  return <HTMLElement>(container.content.firstChild.firstChild);
};

/**
 * @fileoverview Unit tests for the Ck editor copy content service.
 */

describe('Ck editor copy content service', () => {
  let loggerService = new LoggerService();
  let htmlEscaperService = new HtmlEscaperService(loggerService);
  let service;

  let rootScope;
  let ckEditorScope;
  let ckEditorStub: Partial<CKEDITOR.editor> = {
    insertHtml: (_: string) => {},
    execCommand: (_: string): boolean => true
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(($injector) => {
    service = new CkEditorCopyContentService(htmlEscaperService);

    rootScope = $injector.get('$rootScope');
    ckEditorScope = rootScope.$new();

    spyOn(rootScope, '$broadcast').and.callThrough();
  }));

  it('not broadcast copy if copy mode is not active', () => {
    expect(service.copyModeActive).toBe(false);

    const pElement = generateContent('<p>Hello</p>');
    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, pElement);

    expect(rootScope.$broadcast).not.toHaveBeenCalled();
  });

  it('copy and paste plain html elements', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const pElement = generateContent('<p>Hello</p>');

    const insertHtmlSpy = spyOn(ckEditorStub, 'insertHtml');

    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, pElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();

    expect(insertHtmlSpy).toHaveBeenCalledWith('<p>Hello</p>');
  });

  it('copy and paste the top level plain html element when clicking a ' +
    'descendant', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    let listHtml = '<ul><li>Parent bullet<ul><li>Child bullet<ul>' +
      '<li>Grandchild bullet</li></ul></li></ul></li></ul>';
    const listElement = generateContent(listHtml);

    let liElements = listElement.querySelectorAll('li');
    let innerMostLiElement = liElements[liElements.length - 1];
    expect(innerMostLiElement.innerText).toEqual('Grandchild bullet');

    const insertHtmlSpy = spyOn(ckEditorStub, 'insertHtml');
    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, innerMostLiElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();

    expect(insertHtmlSpy).toHaveBeenCalledWith(listHtml);
  });

  it('copy and paste widgets', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const imageWidgetElement = generateContent(
      '<oppia-noninteractive-image alt-with-value="&amp;quot;&amp;quot;" capt' +
      'ion-with-value="&amp;quot;Banana&amp;quot;" filepath-with-value="&amp;' +
      'quot;img_20200630_114637_c2ek92uvb8_height_326_width_490.png&amp;quot;' +
      '"></oppia-noninteractive-image>');

    const execCommandSpy = spyOn(ckEditorStub, 'execCommand');

    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, imageWidgetElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();

    expect(execCommandSpy).toHaveBeenCalledWith(
      'oppiaimage',
      {
        startupData: {
          alt: '',
          caption: 'Banana',
          filepath: 'img_20200630_114637_c2ek92uvb8_height_326_width_490.png'
        }
      }
    );
  });

  it('copy and paste widgets when clicking a widget descendant', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const mathWidgetElement = generateContent(
      '<p><oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_' +
      'latex&amp;quot;:&amp;quot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filen' +
      'ame&amp;quot;:&amp;quot;&amp;quot;}"><span></span></oppia-noninteracti' +
      've-math></p>');
    const nestedMathWidgetElement = mathWidgetElement.firstChild.firstChild;

    const execCommandSpy = spyOn(ckEditorStub, 'execCommand');

    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, nestedMathWidgetElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();

    expect(execCommandSpy).toHaveBeenCalledWith(
      'oppiamath',
      {
        startupData: {
          math_content: {
            raw_latex: '\\frac{x}{y}', svg_filename: ''
          }
        }
      }
    );
  });

  it('copy and paste widgets when clicking a widget ancestor', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const mathWidgetElement = generateContent(
      '<p><oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_' +
      'latex&amp;quot;:&amp;quot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filen' +
      'ame&amp;quot;:&amp;quot;&amp;quot;}"></oppia-noninteractive-math></p>');

    const execCommandSpy = spyOn(ckEditorStub, 'execCommand');

    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, mathWidgetElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();

    expect(execCommandSpy).toHaveBeenCalledWith(
      'oppiamath',
      {
        startupData: {
          math_content: {
            raw_latex: '\\frac{x}{y}', svg_filename: ''
          }
        }
      }
    );
  });
});
