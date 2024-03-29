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
 * @fileoverview ConvertToPlainText pipe for Oppia.
 */

import {Injectable, Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'convertToPlainText'})
@Injectable({
  providedIn: 'root',
})
export class ConvertToPlainTextPipe implements PipeTransform {
  transform(input: string): string {
    let strippedText = input.replace(/(<([^>]+)>)/gi, '');
    strippedText = strippedText.replace(/&nbsp;/gi, ' ');
    strippedText = strippedText.replace(/&quot;/gi, '');

    let trimmedText = strippedText.trim();
    if (trimmedText.length === 0) {
      return strippedText;
    } else {
      return trimmedText;
    }
  }
}
