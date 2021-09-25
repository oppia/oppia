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
 * @fileoverview Sort By pipe for Oppia.
 */

import { Injectable, Pipe, PipeTransform } from '@angular/core';
// SortBy pipe is a replica of angular js orderBy filter.
// The first check of this pipe is to filter out whether the
// received 'value' is a single dimensional array or a multidimensional array.
// If it is a single dimensional array, the pipe will sort out
// the array regarding either string or number.
// In the case of the multidimensional array, the object will be
// sorted with the given property as 'sortKey'.
// We can all specify ascending and descending orders using 'isDescending'.
@Pipe({
  name: 'sortBy',
})
@Injectable({
  providedIn: 'root'
})
export class SortByPipe implements PipeTransform {
  transform<T>(
      value: T[], isDescending: boolean,
      sortKey?: string): T[] {
    if (sortKey === 'default') {
      return value.reverse();
    }

    let numberArray = [];
    let stringArray = [];

    if (!sortKey) {
      numberArray = value.filter(item => typeof item === 'number').sort();
      stringArray = value.filter(item => typeof item === 'string').sort();
    } else {
      const _sortKey = sortKey as keyof T;
      numberArray = value.filter(item => typeof item[_sortKey] === 'number')
        .sort((a, b) => Number(a[_sortKey]) - Number(b[_sortKey]));
      stringArray = value
        .filter(item => typeof item[_sortKey] === 'string')
        .sort((a, b) => {
          if (a[_sortKey] < b[_sortKey]) {
            return -1;
          } else if (a[_sortKey] > b[_sortKey]) {
            return 1;
          } else {
            return 0;
          }
        });
    }
    const sorted = numberArray.concat(stringArray);
    return !isDescending ? sorted : sorted.reverse();
  }
}
