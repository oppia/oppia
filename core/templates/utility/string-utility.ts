// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility functions for strings.
 */

export function camelCaseFromHyphen(str: string): string {
  const newStr = str.replace(/[\])}[{(]/g, '');
  return newStr.replace(
    /-([a-z])/g,
    function(g) {
      return g[1].toUpperCase();
    });
}

export function hasEditDistanceEqualToTwo(
  inputString: string, matchString: string): boolean {
  if (inputString === matchString) {
    return true;
  }
  var editDistance = [];
  for (var i = 0; i <= inputString.length; i++) {
    editDistance.push([i]);
  }
  for (var j = 1; j <= matchString.length; j++) {
    editDistance[0].push(j);
  }
  for (var i = 1; i <= inputString.length; i++) {
    for (var j = 1; j <= matchString.length; j++) {
      if (inputString.charAt(i - 1) === matchString.charAt(j - 1)) {
        editDistance[i][j] = editDistance[i - 1][j - 1];
      } else {
        editDistance[i][j] = Math.min(
          editDistance[i - 1][j - 1], editDistance[i][j - 1],
          editDistance[i - 1][j]) + 1;
      }
    }
  }
  return editDistance[inputString.length][matchString.length] <= 2;
};
