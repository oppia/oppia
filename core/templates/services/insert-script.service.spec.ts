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

import {TestBed, fakeAsync, tick, flush} from '@angular/core/testing';
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
      'listen',
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

  it('should not create new script element if script is still loading', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);

    const result1 = insertScriptService.loadScript(
      KNOWN_SCRIPTS.DONORBOX,
      () => {}
    );
    expect(result1).toBe(true);

    const result2 = insertScriptService.loadScript(
      KNOWN_SCRIPTS.DONORBOX,
      () => {}
    );
    expect(result2).toBe(false);

    expect(mockRenderer.createElement).toHaveBeenCalledTimes(1);
    flush();
  }));

  it('should load MATHJAX script correctly', fakeAsync(() => {
    spyOn(document, 'querySelector').and.returnValue(null);
    insertScriptService.loadScript(KNOWN_SCRIPTS.MATHJAX, () => {});

    const setAttrSpy = mockRenderer.setAttribute as jasmine.Spy;
    const callWasMade = setAttrSpy.calls.any() || mockScriptElement.src !== '';
    expect(callWasMade).toBe(true);
    flush();
  }));
});
