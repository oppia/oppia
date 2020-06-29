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

import { CkEditorCopyContentService } from './ck-editor-copy-content-service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { LoggerService } from 'services/contextual/logger.service';


const generateRichTextElement = (html: string): HTMLElement => {
  const container = document.createElement('template');
  container.innerHTML = `<angular-html-bind>${html}</angular-html-bind>`;
  return <HTMLElement>(container.content.firstChild.firstChild);
};

/**
 * @fileoverview Unit tests for the Ck editor copy content service.
 */

describe('Question player state service', () => {
  let rootScope;
  let copiedElement;
  let ckEditor;
  let ckEditorScope;


  let loggerService = new LoggerService();
  let htmlEscaperService = new HtmlEscaperService(loggerService);
  let service = new CkEditorCopyContentService(htmlEscaperService);

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(($injector) => {
    rootScope = $injector.get('$rootScope');
    ckEditorScope = rootScope.$new();

    spyOn(rootScope, '$broadcast');
    spyOn(ckEditorScope, '$on');
  }));

  it('not broadcast copy if copy mode is not active', () => {
    expect(service.copyModeActive).toBe(false);
    service.broadcastCopy(rootScope, copiedElement);
    expect(rootScope.$broadcast).not.toHaveBeenCalled();
  });

  fit('copy and paste plain html elements', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    const pElement = generateRichTextElement('<p>Hello</p>');

    let ckEditorStub: Partial<CKEDITOR.editor> = {
      insertHtml: () => {},
      execCommand: (commandName: string, data?: any): boolean => {
        return true;
      }
    };
    const insertHtmlSpy = spyOn(ckEditorStub, 'insertHtml');

    service.bindPasteHandler(ckEditorScope, ckEditorStub);
    service.broadcastCopy(rootScope, pElement);
    rootScope.$digest();

    expect(rootScope.$broadcast).toHaveBeenCalled();
    expect(rootScope.$on).toHaveBeenCalled();
    expect(ckEditorScope.$on).toHaveBeenCalled();

    expect(insertHtmlSpy).toHaveBeenCalled();
  });

  it('copy and paste plain html elements', () => {
    expect(service.copyModeActive).toBe(false);
    service.toggleCopyMode();
    expect(service.copyModeActive).toBe(true);

    service.bindPasteHandler(ckEditorScope, ckEditor);
  });
});
