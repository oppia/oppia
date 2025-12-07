// Copyright 2023 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for managing theme preferences and customization.
 */

import {Injectable} from '@angular/core';
import {
  ThemeConfig,
  ThemeConfigBackendApiService,
  ThemeConfigResponse,
} from './theme-config-backend-api.service';
import {Observable} from 'rxjs';
import {LocalStorageService} from './local-storage.service';
import {WindowRef} from './contextual/window-ref.service';

export enum OppiaTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface ThemeCustomizationConfig {
  themePackId?: string;
  logoUrl?: string;
}

export {ThemeConfigResponse};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'oppia_theme_preference';
  private readonly THEME_CONFIG_STORAGE_KEY = 'oppia_theme_config';
  private currentTheme: OppiaTheme = OppiaTheme.SYSTEM;
  private themeConfig: ThemeCustomizationConfig = {};

  constructor(
    private backendApiService: ThemeConfigBackendApiService,
    private localStorageService: LocalStorageService,
    private windowRef: WindowRef
  ) {
    this.init();
  }

  private init(): void {
    // Loads saved theme preference from localStorage.
    const savedTheme = this.localStorageService.getThemePreference();
    if (savedTheme) {
      this.currentTheme = savedTheme as OppiaTheme;
    }
    this.applyTheme();

    // Listens for system theme changes when set to SYSTEM mode.
    if (this.windowRef.nativeWindow.matchMedia) {
      this.windowRef.nativeWindow
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.currentTheme === OppiaTheme.SYSTEM) {
            this.applyTheme();
          }
        });
    }
  }

  setTheme(theme: OppiaTheme): void {
    // Sets the theme preference and applies it.
    this.currentTheme = theme;
    this.localStorageService.setThemePreference(theme);
    this.applyTheme();
  }

  getPreferredTheme(): OppiaTheme {
    // Returns the currently selected theme preference.
    return this.currentTheme;
  }

  getCurrentTheme(): OppiaTheme {
    // Returns the actual theme being displayed (resolves SYSTEM to LIGHT/DARK).
    if (this.currentTheme === OppiaTheme.SYSTEM) {
      return this.getSystemTheme();
    }
    return this.currentTheme;
  }

  private getSystemTheme(): OppiaTheme {
    // Determines the system's preferred color scheme.
    if (
      this.windowRef.nativeWindow.matchMedia &&
      this.windowRef.nativeWindow.matchMedia('(prefers-color-scheme: dark)')
        .matches
    ) {
      return OppiaTheme.DARK;
    }
    return OppiaTheme.LIGHT;
  }

  private applyTheme(): void {
    // Applies the theme to the document body.
    const effectiveTheme = this.getCurrentTheme();
    const body = this.windowRef.nativeWindow.document.body;

    if (effectiveTheme === OppiaTheme.DARK) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  }

  setThemeConfig(config: ThemeCustomizationConfig): void {
    // Sets the theme configuration (theme pack and logo).
    this.themeConfig = config;
    this.localStorageService.setThemeConfig(config);
    this.applyThemeConfig();
  }

  getThemeConfig(): Observable<ThemeConfigResponse> {
    // Fetches the theme configuration from the backend.
    return this.backendApiService.getThemeConfig();
  }

  updateThemeConfig(config: ThemeConfig): Observable<ThemeConfigResponse> {
    // Updates the theme configuration on the backend.
    return this.backendApiService.updateThemeConfig(config);
  }

  getLogoUrl(): string {
    // Returns the configured logo URL or the default.
    return this.themeConfig.logoUrl || '/logo/288x128_logo_white.png';
  }

  private applyThemeConfig(): void {
    // Applies theme pack classes to the body element.
    const body = this.windowRef.nativeWindow.document.body;

    // Removes any existing theme pack classes.
    body.classList.forEach((className: string) => {
      if (className.startsWith('theme-pack-')) {
        body.classList.remove(className);
      }
    });

    // Adds the new theme pack class if one is specified.
    if (this.themeConfig.themePackId) {
      body.classList.add(`theme-pack-${this.themeConfig.themePackId}`);
    }
  }
}
