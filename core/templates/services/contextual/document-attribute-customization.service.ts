// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to add custom attributes to the <html> element.
 */

import {Injectable} from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentAttributeCustomizationService {
  constructor(private windowRef: WindowRef) {}

  addAttribute(attribute: string, value: string): void {
    this.windowRef.nativeWindow.document.documentElement.setAttribute(
      attribute,
      value
    );
  }
}
