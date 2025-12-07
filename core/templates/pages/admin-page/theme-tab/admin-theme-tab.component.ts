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
 * @fileoverview Component for the admin theme tab.
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  ThemeService,
  OppiaTheme,
  ThemeCustomizationConfig,
} from 'services/theme.service';

@Component({
  selector: 'oppia-admin-theme-tab',
  templateUrl: './admin-theme-tab.component.html',
})
export class AdminThemeTabComponent implements OnInit {
  @Output() setStatusMessage = new EventEmitter<string>();

  // Available theme packs
  availableThemePacks = [
    {id: '', name: 'Default (Teal)'},
    {id: 'ocean', name: 'Ocean (Blue)'},
    {id: 'forest', name: 'Forest (Green)'},
    {id: 'sunset', name: 'Sunset (Orange)'},
    {id: 'lavender', name: 'Lavender (Purple)'},
  ];
  selectedThemePack = '';

  // Logo configuration
  logoUrl = '/logo/288x128_logo_white.png';

  constructor(
    private themeService: ThemeService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Fetch current config on load
    this.http
      .get<{theme_customization_config: string}>('/theme_config_handler')
      .subscribe({
        next: response => {
          if (response && response.theme_customization_config) {
            try {
              const config = JSON.parse(response.theme_customization_config);
              this.selectedThemePack = config.themePackId || '';
              this.logoUrl = config.logoUrl || '/logo/288x128_logo_white.png';
            } catch {
              // Use defaults
            }
          }
        },
      });
  }

  saveThemeConfig(): void {
    const config: ThemeCustomizationConfig = {
      themePackId: this.selectedThemePack,
      logoUrl: this.logoUrl,
    };
    const configJson = JSON.stringify(config);

    // Update via platform parameters admin API
    this.http
      .post('/adminhandler', {
        action: 'save_config_properties',
        new_config_property_values: {
          theme_customization_config: configJson,
        },
      })
      .subscribe({
        next: () => {
          // Apply immediately
          this.themeService.setThemeConfig(config);
          this.setStatusMessage.emit(
            'Theme configuration saved successfully! Refresh to see changes.'
          );
        },
        error: err => {
          this.setStatusMessage.emit(
            'Error saving theme config: ' +
              (err.error?.error || 'Unknown error')
          );
        },
      });
  }

  resetToDefaults(): void {
    this.selectedThemePack = '';
    this.logoUrl = '/logo/288x128_logo_white.png';
    this.themeService.setThemeConfig({});
    this.setStatusMessage.emit(
      'Theme reset to defaults. Click Save to persist.'
    );
  }

  // Preview theme changes immediately
  previewThemePack(): void {
    this.themeService.setThemeConfig({
      themePackId: this.selectedThemePack,
      logoUrl: this.logoUrl,
    });
  }

  previewDarkTheme(): void {
    this.themeService.setTheme(OppiaTheme.DARK);
  }

  previewLightTheme(): void {
    this.themeService.setTheme(OppiaTheme.LIGHT);
  }
}
