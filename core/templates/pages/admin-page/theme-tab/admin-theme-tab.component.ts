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
 * @fileoverview Admin theme tab component.
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {
  ThemeService,
  OppiaTheme,
  ThemeCustomizationConfig,
  ThemeConfigResponse,
} from 'core/templates/services/theme.service';

@Component({
  selector: 'oppia-admin-theme-tab',
  templateUrl: './admin-theme-tab.component.html',
})
export class AdminThemeTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();

  // Available theme packs.
  availableThemePacks = [
    {id: '', name: 'Default (Teal)'},
    {id: 'ocean', name: 'Ocean (Blue)'},
    {id: 'forest', name: 'Forest (Green)'},
    {id: 'sunset', name: 'Sunset (Orange)'},
    {id: 'lavender', name: 'Lavender (Purple)'},
  ];

  // Selected theme pack identifier.
  selectedThemePack = '';

  // Logo configuration.
  logoUrl = '/logo/288x128_logo_white.png';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Fetches the current theme configuration on load.
    this.themeService
      .getThemeConfig()
      .subscribe((response: ThemeConfigResponse) => {
        if (response && response.theme_customization_config) {
          try {
            const config = JSON.parse(
              response.theme_customization_config
            ) as ThemeCustomizationConfig;
            this.selectedThemePack = config.themePackId || '';
            this.logoUrl = config.logoUrl || '/logo/288x128_logo_white.png';
            this.themeService.setThemeConfig(config);
          } catch {
            // Uses default values when parsing fails.
          }
        }
      });
  }

  saveThemeConfig(): void {
    const config: ThemeCustomizationConfig = {
      themePackId: this.selectedThemePack,
      logoUrl: this.logoUrl,
    };

    // Persists the theme configuration through the backend API service.
    this.themeService.updateThemeConfig(config).subscribe({
      next: () => {
        this.themeService.setThemeConfig(config);
        this.setStatusMessage.emit(
          'Theme configuration saved successfully. Refresh to see changes.'
        );
      },
      error: err => {
        const errorMessage = err?.error?.error || 'Unknown error';
        this.setStatusMessage.emit(
          'Error saving theme config: ' + errorMessage
        );
      },
    });
  }

  resetToDefaults(): void {
    // Resets the theme configuration to default values.
    this.selectedThemePack = '';
    this.logoUrl = '/logo/288x128_logo_white.png';
    this.themeService.setThemeConfig({
      themePackId: this.selectedThemePack,
      logoUrl: this.logoUrl,
    });
    this.setStatusMessage.emit(
      'Theme reset to defaults. Click Save to persist.'
    );
  }

  // Previews the currently selected theme pack and logo without saving.
  previewThemePack(): void {
    this.themeService.setThemeConfig({
      themePackId: this.selectedThemePack,
      logoUrl: this.logoUrl,
    });
  }

  // Previews the dark theme.
  previewDarkTheme(): void {
    this.themeService.setTheme(OppiaTheme.DARK);
  }

  // Previews the light theme.
  previewLightTheme(): void {
    this.themeService.setTheme(OppiaTheme.LIGHT);
  }
}
