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
 * @fileoverview Frontend theme service that talks to the backend API service.
 */

import {Injectable} from '@angular/core';
import {
  ThemeConfig,
  ThemeConfigBackendApiService,
  ThemeConfigResponse,
} from './theme-config-backend-api.service';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(private backendApiService: ThemeConfigBackendApiService) {}

  getThemeConfig(): Observable<ThemeConfigResponse> {
    // Loads the theme configuration from the backend.
    return this.backendApiService.getThemeConfig();
  }

  updateThemeConfig(config: ThemeConfig): Observable<ThemeConfigResponse> {
    // Sends an updated theme configuration to the backend.
    return this.backendApiService.updateThemeConfig(config);
  }
}
