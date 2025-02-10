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
 * @fileoverview TruncateAtFirstEllipsis pipe for Oppia.
 */

import {Pipe, PipeTransform} from '@angular/core';

// Filter that truncates a string at the first '...'.
@Pipe({name: 'truncateAtFirstEllipsis'})
export class TruncateAtFirstEllipsisPipe implements PipeTransform {
  pattern = /\.\.\./g;
  transform(input: string): string {
    if (!input) {
      return '';
    }
    let matchLocation = input.search(this.pattern);
    return matchLocation === -1 ? input : input.substring(0, matchLocation);
  }
}
