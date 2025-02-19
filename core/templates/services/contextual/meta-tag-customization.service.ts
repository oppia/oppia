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
 * @fileoverview Service to add custom meta tags.
 */

import {Injectable} from '@angular/core';

import {WindowRef} from './window-ref.service';

export interface MetaAttribute {
  propertyType: string;
  propertyValue: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class MetaTagCustomizationService {
  constructor(private windowRef: WindowRef) {}

  addOrReplaceMetaTags(attrArray: MetaAttribute[]): void {
    attrArray.forEach(attr => {
      // Find and remove exisiting meta tag.
      let existingMetaTag = this.windowRef.nativeWindow.document.querySelector(
        'meta[' + attr.propertyType + '="' + attr.propertyValue + '"]'
      );
      if (existingMetaTag) {
        existingMetaTag.remove();
      }
      // Add new meta tag.
      let meta = this.windowRef.nativeWindow.document.createElement('meta');
      meta.setAttribute(attr.propertyType, attr.propertyValue);
      meta.setAttribute('content', attr.content);
      this.windowRef.nativeWindow.document.head.appendChild(meta);
    });
  }
}
