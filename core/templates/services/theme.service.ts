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
 * @fileoverview Service for managing custom branding and theming.
 */

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowRef} from 'services/contextual/window-ref.service';

export enum OppiaTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface ThemeCustomizationConfig {
  themePackId?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private static readonly THEME_KEY = 'oppia_theme_preference';

  // Current active theme (resolved to LIGHT or DARK)
  private _currentTheme = new BehaviorSubject<OppiaTheme>(OppiaTheme.LIGHT);
  // User's preferred setting (can be SYSTEM)
  private _preference = new BehaviorSubject<OppiaTheme>(OppiaTheme.SYSTEM);

  // Theme Config (loaded from backend or default)
  private _themeConfig: ThemeCustomizationConfig = {};
  private static readonly CONFIG_URL = '/theme_config_handler';

  constructor(
    private localStorageService: LocalStorageService,
    private windowRef: WindowRef,
    private http: HttpClient
  ) {}

  /**
   * Initializes the theme service. Should be called on application startup.
   */
  init(): void {
    const savedTheme =
      this.localStorageService.getThemePreference() as OppiaTheme;
    // Default to SYSTEM if nothing is saved
    const initialPreference = savedTheme || OppiaTheme.SYSTEM;
    this.setTheme(initialPreference);

    // Fetch theme config from backend
    this.fetchThemeConfig();

    // Listen for system changes if in system mode
    if (this.windowRef.nativeWindow.matchMedia) {
      this.windowRef.nativeWindow
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => {
          if (this._preference.getValue() === OppiaTheme.SYSTEM) {
            this.applyTheme(e.matches ? OppiaTheme.DARK : OppiaTheme.LIGHT);
          }
        });
    }
  }

  /**
   * Fetches theme config from backend and applies it.
   */
  private fetchThemeConfig(): void {
    this.http
      .get<{theme_customization_config?: string}>(ThemeService.CONFIG_URL)
      .subscribe({
        next: response => {
          if (response && response.theme_customization_config) {
            try {
              const config = JSON.parse(response.theme_customization_config);
              this.setThemeConfig(config);
            } catch {
              // Invalid JSON, use defaults
            }
          }
        },
        error: () => {
          // On error, keep defaults
        },
      });
  }

  /**
   * Updates the user's theme preference.
   * @param theme The new theme preference.
   */
  setTheme(theme: OppiaTheme): void {
    this._preference.next(theme);
    this.localStorageService.updateThemePreference(theme);

    if (theme === OppiaTheme.SYSTEM) {
      const isSystemDark =
        this.windowRef.nativeWindow.matchMedia &&
        this.windowRef.nativeWindow.matchMedia('(prefers-color-scheme: dark)')
          .matches;
      this.applyTheme(isSystemDark ? OppiaTheme.DARK : OppiaTheme.LIGHT);
    } else {
      this.applyTheme(theme);
    }
  }

  /**
   * Returns the user's current preference.
   */
  getPreferredTheme(): OppiaTheme {
    return this._preference.getValue();
  }

  /**
   * Returns the logo URL based on the current theme config.
   */
  getLogoUrl(): string {
    return this._themeConfig.logoUrl || '/logo/288x128_logo_white.png';
  }

  /**
   * Updates the theme configuration.
   * @param config The new configuration.
   */
  setThemeConfig(config: ThemeCustomizationConfig): void {
    this._themeConfig = config;
    this.updateThemeClasses();
  }

  /**
   * Returns an observable of the currently active resolved theme.
   */
  get onThemeChange(): Observable<OppiaTheme> {
    return this._currentTheme.asObservable();
  }

  private applyTheme(theme: OppiaTheme): void {
    this._currentTheme.next(theme);
    this.updateThemeClasses();
  }

  getCurrentTheme(): OppiaTheme {
    return this._currentTheme.getValue();
  }

  private updateThemeClasses(): void {
    const theme = this._currentTheme.getValue();
    const body = this.windowRef.nativeWindow.document.body;

    // Handle Light/Dark
    if (theme === OppiaTheme.DARK) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }

    // Handle Theme Pack
    // Remove existing theme-pack classes
    body.classList.forEach(cls => {
      if (cls.startsWith('theme-pack-')) {
        body.classList.remove(cls);
      }
    });

    if (this._themeConfig.themePackId) {
      body.classList.add(`theme-pack-${this._themeConfig.themePackId}`);
    }
  }
}
