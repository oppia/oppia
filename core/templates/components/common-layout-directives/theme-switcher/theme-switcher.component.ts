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
 * @fileoverview Component for the theme switcher.
 */

import {Component} from '@angular/core';
import {ThemeService, OppiaTheme} from 'services/theme.service';

@Component({
  selector: 'oppia-theme-switcher',
  templateUrl: './theme-switcher.component.html',
})
export class ThemeSwitcherComponent {
  constructor(private themeService: ThemeService) {}

  toggleTheme(): void {
    const currentResolved = this.themeService.getCurrentTheme();
    if (currentResolved === OppiaTheme.LIGHT) {
      this.themeService.setTheme(OppiaTheme.DARK);
    } else {
      this.themeService.setTheme(OppiaTheme.LIGHT);
    }
  }

  getIcon(): string {
    const current = this.themeService.getPreferredTheme();
    return current === OppiaTheme.DARK ? 'dark_mode' : 'light_mode';
  }
}
