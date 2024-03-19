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
 * @fileoverview Truncate filter for Oppia.
 */

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {ConvertToPlainTextPipe} from './convert-to-plain-text.pipe';

// Pipe that truncates long descriptors.
@Pipe({name: 'truncate'})
@Injectable({
  providedIn: 'root',
})
export class TruncatePipe implements PipeTransform {
  constructor(private convertToPlainTextPipe: ConvertToPlainTextPipe) {}

  transform(input: string | number, length: number, suffix?: string): string {
    if (!input) {
      return '';
    }
    if (isNaN(length)) {
      length = 70;
    }
    if (suffix === undefined) {
      suffix = '...';
    }
    if (!(typeof input === 'string')) {
      input = String(input);
    }
    input = this.convertToPlainTextPipe.transform(input);
    return input.length <= length
      ? input
      : input.substring(0, length - suffix.length) + suffix;
  }
}
