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
 * @fileoverview Unit tests for the Ck editor copy content service.
 */

import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {LoggerService} from 'services/contextual/logger.service';

/**
 * Returns a HTMLElement containing the element to copy.
 * @param {string} html The hmtl to place in angular-html-bind element.
 * @returns {HTMLElement} The element created by param html.
 */
const generateContent = (html: string): HTMLElement => {
  const container = document.createElement('template');
  container.innerHTML = `<angular-html-bind>${html.trim()}</angular-html-bind>`;
  // Return element inside <angular-html-bind />
  if (
    container.content.firstChild === null ||
    container.content.firstChild.firstChild === null
  ) {
    throw new Error('First Child is null');
  }
  return container.content.firstChild.firstChild as HTMLElement;
};

describe('Ck editor copy content service', () => {
  let loggerService = new LoggerService();
  let htmlEscaperService = new HtmlEscaperService(loggerService);

  let service: CkEditorCopyContentService;
  let ckEditorStub: CKEDITOR.editor;
  let insertHtmlSpy: jasmine.Spy<
    (html: string, mode?: string, range?: CKEDITOR.dom.range) => void
  >;
  let execCommandSpy: jasmine.Spy<(commandName: string) => boolean>;

  beforeEach(() => {
    ckEditorStub = {
      id: 'editor1',
      insertHtml: (html: string) => {},
      execCommand: (commandName: string): boolean => true,
    } as CKEDITOR.editor;
    insertHtmlSpy = spyOn(ckEditorStub, 'insertHtml');
    execCommandSpy = spyOn(ckEditorStub, 'execCommand');

    service = new CkEditorCopyContentService(htmlEscaperService);
  });

  it('should not copy and paste if copy mode is not active', () => {
    expect(service.copyModeActive).toBe(false);

    const pElement = generateContent('<p>Hello</p>');

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(pElement);

    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).not.toHaveBeenCalled();
  });

  it('should copy and paste plain html elements', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const pElement = generateContent('<p>Hello<!--comment--></p>');

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(pElement);

    expect(insertHtmlSpy).toHaveBeenCalledWith('<p>Hello</p>');
    expect(execCommandSpy).not.toHaveBeenCalled();
  });

  it(
    'should copy and paste the top level plain html element when clicking a ' +
      'descendant',
    () => {
      expect(service.copyModeActive).toBe(false);
      service.toggleCopyMode();
      expect(service.copyModeActive).toBe(true);

      // eslint-disable-next-line  @typescript-eslint/quotes
      let listHtml = `<ul><li>Parent bullet<ul><li>Child bullet<ul>\
<li>Grandchild bullet</li></ul></li></ul></li></ul>`;
      const listElement = generateContent(listHtml);

      let liElements = listElement.querySelectorAll('li');
      let innerMostLiElement = liElements[liElements.length - 1];
      expect(innerMostLiElement.innerText).toEqual('Grandchild bullet');

      service.bindPasteHandler(ckEditorStub);
      service.broadcastCopy(innerMostLiElement);

      expect(insertHtmlSpy).toHaveBeenCalledWith(listHtml);
      expect(execCommandSpy).not.toHaveBeenCalled();
    }
  );

  it('should copy and paste widgets', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);
    const imageWidgetElement = generateContent(
      '<oppia-noninteractive-image ng-reflect-alt-with-value="&amp;" alt-with' +
        '-value="&amp;quot;&amp;quot;" caption-with-value="&amp;quot;Banana&amp' +
        ';quot;" filepath-with-value="&amp;quot;img_20200630_114637_c2ek92uvb8_' +
        'height_326_width_490.png&amp;quot;"></oppia-noninteractive-image>'
    );

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(imageWidgetElement);

    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('oppiaimage', {
      startupData: {
        alt: '',
        caption: 'Banana',
        filepath: 'img_20200630_114637_c2ek92uvb8_height_326_width_490.png',
        isCopied: true,
      },
    });
  });

  it('should not copy and paste non-allowed widgets', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const imageWidgetElement = generateContent(
      '<oppia-noninteractive-fake alt-with-value="&amp;quot;&amp;quot;" capt' +
        'ion-with-value="&amp;quot;Banana&amp;quot;" filepath-with-value="&amp;' +
        'quot;img_20200630_114637_c2ek92uvb8_height_326_width_490.png&amp;quot;' +
        '"></oppia-noninteractive-fake>'
    );

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(imageWidgetElement);

    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).not.toHaveBeenCalled();
  });

  it('should copy and paste widgets when clicking a widget descendant', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const mathWidgetElement = generateContent(
      '<p><oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_' +
        'latex&amp;quot;:&amp;quot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filen' +
        'ame&amp;quot;:&amp;quot;&amp;quot;}"><span></span></oppia-noninteracti' +
        've-math></p>'
    );
    if (
      mathWidgetElement.firstChild === null ||
      mathWidgetElement.firstChild.firstChild === null
    ) {
      throw new Error('First Child is null');
    }
    const nestedMathWidgetElement = mathWidgetElement.firstChild
      .firstChild as HTMLElement;

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(nestedMathWidgetElement);

    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('oppiamath', {
      startupData: {
        math_content: {
          raw_latex: '\\frac{x}{y}',
          svg_filename: '',
        },
        isCopied: true,
      },
    });
  });

  it('should copy and paste widgets when clicking a widget ancestor', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const mathWidgetElement = generateContent(
      '<p><oppia-noninteractive-math math_content-with-value="{&amp;quot;raw_' +
        'latex&amp;quot;:&amp;quot;\\\\frac{x}{y}&amp;quot;,&amp;quot;svg_filen' +
        'ame&amp;quot;:&amp;quot;&amp;quot;}"></oppia-noninteractive-math></p>'
    );

    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(mathWidgetElement);

    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('oppiamath', {
      startupData: {
        math_content: {
          raw_latex: '\\frac{x}{y}',
          svg_filename: '',
        },
        isCopied: true,
      },
    });
  });

  it('should not copy and paste after editor is destroyed', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const pElement = generateContent('<p>Hello</p>');

    ckEditorStub = {...ckEditorStub, status: 'destroyed'} as CKEDITOR.editor;
    service.bindPasteHandler(ckEditorStub);
    service.broadcastCopy(pElement);
    expect(insertHtmlSpy).not.toHaveBeenCalled();
    expect(execCommandSpy).not.toHaveBeenCalled();
  });
});
