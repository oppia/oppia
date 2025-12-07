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
 * @fileoverview Unit tests for ThemeService.
 */

import {TestBed} from '@angular/core/testing';
import {ThemeService, OppiaTheme} from './theme.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockWindowRef {
  nativeWindow = {
    document: {
      body: {
        classList: {
          add: jasmine.createSpy('add'),
          remove: jasmine.createSpy('remove'),
        },
      },
    },
    matchMedia: jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener'),
    }),
  };
}

describe('ThemeService', () => {
  let themeService: ThemeService;
  let localStorageService: LocalStorageService;
  let mockWindowRef: MockWindowRef;

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        LocalStorageService,
        {provide: WindowRef, useValue: mockWindowRef},
      ],
    });

    themeService = TestBed.inject(ThemeService);
    localStorageService = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(themeService).toBeTruthy();
  });

  it('should initialize with system default when no local storage exists', () => {
    spyOn(localStorageService, 'get').and.returnValue(null);
    themeService.init();
    expect(themeService.getPreferredTheme()).toBe(OppiaTheme.SYSTEM);
  });

  it('should initialize with stored preference', () => {
    spyOn(localStorageService, 'get').and.returnValue(OppiaTheme.DARK);
    themeService.init();
    expect(themeService.getPreferredTheme()).toBe(OppiaTheme.DARK);
    expect(
      mockWindowRef.nativeWindow.document.body.classList.add
    ).toHaveBeenCalledWith('dark-mode');
  });

  it('should update theme and persistence when setTheme is called', () => {
    const setSpy = spyOn(localStorageService, 'set');
    themeService.setTheme(OppiaTheme.DARK);

    expect(setSpy).toHaveBeenCalledWith(
      'oppia_theme_preference',
      OppiaTheme.DARK
    );
    expect(
      mockWindowRef.nativeWindow.document.body.classList.add
    ).toHaveBeenCalledWith('dark-mode');
  });

  it('should respect system preference when set to SYSTEM', () => {
    // Mock system is dark.
    (mockWindowRef.nativeWindow.matchMedia as jasmine.Spy).and.returnValue({
      matches: true,
      addEventListener: jasmine.createSpy('addEventListener'),
    });

    themeService.setTheme(OppiaTheme.SYSTEM);
    expect(
      mockWindowRef.nativeWindow.document.body.classList.add
    ).toHaveBeenCalledWith('dark-mode');
  });

  it('should respect system preference when set to SYSTEM (light)', () => {
    // Mock system is light.
    (mockWindowRef.nativeWindow.matchMedia as jasmine.Spy).and.returnValue({
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener'),
    });

    themeService.setTheme(OppiaTheme.SYSTEM);
    expect(
      mockWindowRef.nativeWindow.document.body.classList.remove
    ).toHaveBeenCalledWith('dark-mode');
  });

  describe('Theme Config', () => {
    it('should return default logo URL when no config is set', () => {
      expect(themeService.getLogoUrl()).toBe('/logo/288x128_logo_white.png');
    });

    it('should return configured logo URL when set', () => {
      themeService.setThemeConfig({logoUrl: '/assets/custom-logo.png'});
      expect(themeService.getLogoUrl()).toBe('/assets/custom-logo.png');
    });

    it('should apply theme pack class to body', () => {
      // Need to mock forEach for classList.
      const classList = new Set<string>();
      const addSpy = jasmine.createSpy('add').and.callFake((cls: string) => {
        classList.add(cls);
      });
      const removeSpy = jasmine
        .createSpy('remove')
        .and.callFake((cls: string) => {
          classList.delete(cls);
        });
      mockWindowRef.nativeWindow.document.body.classList = {
        add: addSpy,
        remove: removeSpy,
        forEach: (fn: (cls: string) => void) => classList.forEach(fn),
      } as unknown as DOMTokenList;

      themeService.setThemeConfig({themePackId: 'ocean'});
      expect(classList.has('theme-pack-ocean')).toBe(true);
    });
  });

  describe('getCurrentTheme', () => {
    it('should return current resolved theme', () => {
      themeService.setTheme(OppiaTheme.DARK);
      expect(themeService.getCurrentTheme()).toBe(OppiaTheme.DARK);
    });
  });
});
