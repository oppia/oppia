// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview SummarizeNonnegativeNumber pipe for Oppia.
 */
import {Pipe, PipeTransform} from '@angular/core';

// Filter that summarizes a large number to a decimal followed by
// the appropriate metric prefix (K, M or B). For example, 167656
// becomes 167.7K.
// Users of this filter should ensure that the input is a non-negative number.
@Pipe({name: 'summarizeNonnegativeNumber'})
export class SummarizeNonnegativeNumberPipe implements PipeTransform {
  transform(input: number): number | string {
    // Nine zeros for billions (e.g. 146008788788 --> 146.0B).
    // Six zeros for millions (e.g. 146008788 --> 146.0M).
    // Three zeros for thousands (e.g. 146008 --> 146.0K).
    // No change for small numbers (e.g. 12 --> 12).
    return input >= 1.0e9
      ? (input / 1.0e9).toFixed(1) + 'B'
      : input >= 1.0e6
        ? (input / 1.0e6).toFixed(1) + 'M'
        : input >= 1.0e3
          ? (input / 1.0e3).toFixed(1) + 'K'
          : input;
  }
}
