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
 * @fileoverview Unit tests for InsertScriptService.
 */

import {
  TestBed,
  fakeAsync,
  tick,
  flush,
  discardPeriodicTasks,
} from '@angular/core/testing';
import {Renderer2, RendererFactory2} from '@angular/core';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';

describe('InsertScriptService', () => {
  let insertScriptService: InsertScriptService;
  let mockRenderer: jasmine.SpyObj<Renderer2>;
  let mockScriptElement: HTMLScriptElement;

  beforeEach(() => {
    mockScriptElement = {
      setAttribute: jasmine.createSpy('setAttribute'),
      src: '',
      tagName: 'SCRIPT',
      parentNode: {removeChild: jasmine.createSpy('removeChild')},
      onload: null,
      onerror: null,
    } as unknown as HTMLScriptElement;

    mockRenderer = jasmine.createSpyObj('Renderer2', [
      'createElement',
      'appendChild',
      'setAttribute',
    ]);
    mockRenderer.createElement.and.returnValue(mockScriptElement);

    TestBed.configureTestingModule({
      providers: [
        InsertScriptService,
        {
          provide: RendererFactory2,
          useValue: {createRenderer: () => mockRenderer},
        },
      ],
    });
    insertScriptService = TestBed.inject(InsertScriptService);
  });

  it('should not reload script if already loaded', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX, () => {});

    if (mockScriptElement.onload) {
      (mockScriptElement.onload as () => void)();
    }
    tick();

    const result = insertScriptService.loadScript(
      KNOWN_SCRIPTS.DONORBOX,
      () => {}
    );
    expect(result).toBe(false);
    flush();
  }));

  it('should load MATHJAX script correctly', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    insertScriptService.loadScript(KNOWN_SCRIPTS.MATHJAX);
    expect(mockScriptElement.src).toContain('MathJax.js');
    flush();
  }));

  it('should load PENCILCODE script correctly', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    insertScriptService.loadScript(KNOWN_SCRIPTS.PENCILCODE);
    expect(mockScriptElement.src).toBe(
      'https://pencilcode.net/lib/pencilcodeembed.js'
    );
    flush();
  }));

  it('should return false for unknown script type', fakeAsync(() => {
    const result = insertScriptService.loadScript(
      'invalid_script' as KNOWN_SCRIPTS
    );
    expect(result).toBe(false);
    flush();
  }));

  it('should handle error when script fails to load', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);

    const scriptPromise = (
      insertScriptService as unknown as {
        partiallyLoadedScripts: Map<KNOWN_SCRIPTS, Promise<void>>;
      }
    ).partiallyLoadedScripts.get(KNOWN_SCRIPTS.DONORBOX);

    if (scriptPromise) {
      scriptPromise.catch(() => {});
    }

    if (mockScriptElement.onerror) {
      (mockScriptElement.onerror as (event: Event) => void)(new Event('error'));
    }
    tick();

    const retryResult = insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);
    expect(retryResult).toBe(true);
    flush();
  }));

  it('should log error when partially loaded script fails', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    const consoleSpy = spyOn(console, 'error');

    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);

    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX);

    const scriptPromise = (
      insertScriptService as unknown as {
        partiallyLoadedScripts: Map<KNOWN_SCRIPTS, Promise<void>>;
      }
    ).partiallyLoadedScripts.get(KNOWN_SCRIPTS.DONORBOX);

    if (scriptPromise) {
      scriptPromise.catch(() => {});
    }

    if (mockScriptElement.onerror) {
      (mockScriptElement.onerror as (event: Event) => void)(new Event('error'));
    }

    tick();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Script loading failed:',
      KNOWN_SCRIPTS.DONORBOX
    );
    discardPeriodicTasks();
  }));

  it('should call the callback function when script loads successfully', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    const callback = jasmine.createSpy('callback');
    insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX, callback);

    if (mockScriptElement.onload) {
      (mockScriptElement.onload as () => void)();
    }
    tick();
    expect(callback).toHaveBeenCalled();
    flush();
  }));
});
