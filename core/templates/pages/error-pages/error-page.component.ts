// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the error page.
 */

import {Component, Input, OnInit} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'error-page',
  templateUrl: './error-page.component.html',
  styleUrls: [],
})
export class ErrorPageComponent implements OnInit {
  // This property is initialized using Angular lifecycle hooks.
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() statusCode!: string;

  customErrorMessage: string | null = null;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Get custom error message from sessionStorage.
    // Auth guards store it there since location.replaceState clears router state.
    const storedErrorMessage =
      this.windowRef.nativeWindow.sessionStorage.getItem(
        'oppia_401_error_message'
      );
    if (storedErrorMessage) {
      this.customErrorMessage = storedErrorMessage;
      // Clear it immediately after reading so it doesn't persist across page reloads.
      this.windowRef.nativeWindow.sessionStorage.removeItem(
        'oppia_401_error_message'
      );
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getStatusCode(): number {
    return Number(this.statusCode);
  }
}
