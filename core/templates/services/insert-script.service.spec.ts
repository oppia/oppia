// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview test for insert script service
 */
import {RendererFactory2} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';

class MockRenderer {
  createElement(tag: string) {
    return document.createElement(tag);
  }
  appendChild(parent: HTMLElement, newChild: HTMLElement) {
    parent.appendChild(newChild);
  }
}

class MockRendererFactory {
  createRenderer() {
    return new MockRenderer();
  }
}

describe('InsertScriptService', () => {
  let insertScriptService: InsertScriptService;
  let rendererFactory: RendererFactory2;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InsertScriptService,
        {provide: RendererFactory2, useClass: MockRendererFactory},
      ],
    });
    insertScriptService = TestBed.get(InsertScriptService);
    rendererFactory = TestBed.get(RendererFactory2);
  });

  it('should not reload script if already loaded', (done: jasmine.DoneFn) => {
    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX, () => {
      const result = insertScriptService.loadScript(
        KNOWN_SCRIPTS.DONORBOX,
        () => {
          expect(result).toBe(false);
          done();
        }
      );
    });
  });

  it('should not create new script element if script is still loading', (done: jasmine.DoneFn) => {
    spyOn(
      rendererFactory.createRenderer(null, null),
      'createElement'
    ).and.callThrough();

    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX, () => {
      expect(insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX)).toBe(
        false
      );
      done();
    });

    const result = insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);
    expect(result).toBe(true);
  });

  it('should handle script load error correctly', (done: jasmine.DoneFn) => {
    const mockScriptElement: Partial<HTMLScriptElement> = {
      onload: null,
      onerror: null,
      src: '',
      setAttribute: () => {},
    };

    spyOn(document, 'createElement').and.returnValue(mockScriptElement);

    spyOn(document.body, 'appendChild').and.callFake(
      (script: HTMLScriptElement) => {
        setTimeout(() => {
          script.onerror(new ErrorEvent('error'));
        }, 10);
      }
    );

    const result = insertScriptService.loadScript(
      KNOWN_SCRIPTS.DONORBOX,
      () => {
        fail('onLoadCb should not be called when the script fails to load.');
      }
    );

    expect(result).toBe(true);

    setTimeout(() => {
      expect(
        // eslint-disable-next-line dot-notation
        insertScriptService['partiallyLoadedScripts'].has(
          KNOWN_SCRIPTS.DONORBOX
        )
      ).toBe(false);
      done();
    }, 20);
  });

  it('should return false for unknown scripts', () => {
    const result = insertScriptService.loadScript(KNOWN_SCRIPTS.UNKNOWN);
    expect(result).toBe(false);
  });

  it('should load MATHJAX script correctly', (done: jasmine.DoneFn) => {
    const mockScriptElement: Partial<HTMLScriptElement> = {
      onload: null,
      onerror: null,
      src: '',
      setAttribute: () => {},
    };

    spyOn(document, 'createElement').and.returnValue(mockScriptElement);
    spyOn(document.body, 'appendChild').and.callFake(
      (script: HTMLScriptElement) => {
        setTimeout(() => {
          script.onload();
        }, 10);
      }
    );

    const result = insertScriptService.loadScript(KNOWN_SCRIPTS.MATHJAX, () => {
      expect(mockScriptElement.src).toContain(
        '/third_party/static/MathJax-2.7.5/MathJax.js?config=default'
      );
      done();
    });

    expect(result).toBe(true);
  });

  it('should insert script into html', (done: jasmine.DoneFn) => {
    const result = insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);
    expect(result).toBe(true);
    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX, () => {
      expect(insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX)).toBe(
        false
      );
      expect(insertScriptService.loadScript(KNOWN_SCRIPTS.UNKNOWN)).toBe(false);
      done();
    });
  });
});
