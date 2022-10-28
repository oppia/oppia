// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Winnowing preprocessing functions.
 *
 * IMPORTANT NOTE: The preprocessing functions are implemented according to
 * winnowing preprocessing functions used on Oppia-ml. These functions
 * are simple translation of Python code to JS code and they both do exact
 * same task.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface TokenToId {
  [x: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class WinnowingPreprocessingService {
  static generateHashValue(tokens: string[], tokenToId: TokenToId): number {
    var hashVal = 0;
    var n = tokens.length - 1;
    var base = Math.pow(Object.keys(tokenToId).length, n);

    tokens.forEach((token: string) => {
      hashVal += tokenToId[token] * base;
      base /= Object.keys(tokenToId).length;
    });

    return hashVal;
  }

  getKGramHashes(
      tokens: string[], tokenToId: TokenToId, K: number): number[] {
    // Generate all possible k-gram hashes from tokens.
    var kGramHashes = [];
    var kTokens: string[];
    for (var i = 0; i < tokens.length - K + 1; i += 1) {
      kTokens = tokens.slice(i, i + K);
      kGramHashes.push(WinnowingPreprocessingService.generateHashValue(
        kTokens, tokenToId));
    }
    return kGramHashes;
  }

  getFingerprintFromHashes(
      kGramHashes: number[], T: number, K: number): number[][] {
    // Generate fingerprint of a document from its k-gram hashes.
    var windowSize = T - K + 1;
    var fingerprintHashesIndex: Set<number> = new Set();
    for (var i = 0; i < kGramHashes.length - windowSize + 1; i += 1) {
      var windowHashes = kGramHashes.slice(i, i + windowSize);
      var minHashValue = Math.min.apply(Math, windowHashes);
      var minHashIndex = i + windowHashes.indexOf(minHashValue);
      fingerprintHashesIndex.add(minHashIndex);
    }

    var fingerprint: number[][] = [];
    fingerprintHashesIndex.forEach((hashIndex: number) => {
      fingerprint.push([kGramHashes[hashIndex], hashIndex]);
    });

    return fingerprint;
  }
}

angular.module('oppia').factory(
  'WinnowingPreprocessingService',
  downgradeInjectable(WinnowingPreprocessingService));
