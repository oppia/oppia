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
 * @fileoverview Vectorizer function which mirrors the CountVectorizer feature
 * extractor of sklearn.
 *
 * IMPORTANT NOTE: The Vectorizer function uses the vocabulary that was
 * extracted during the training. During training scikit's
 * CountVectorizer class is used for this purpose. If there are any changes
 * in scikit's CountVectorize class then corresponding changes must be
 * propagated here.
 */

import {downgradeInjectable} from '@angular/upgrade/static';
import {Injectable} from '@angular/core';

interface Vocabulary {
  [char: string]: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountVectorizerService {
  vectorize(tokens: string[] | null, vocabulary: Vocabulary): number[] {
    var vectorLength = Object.keys(vocabulary).length;
    var vector: number[] = [];
    for (var i = 0; i < vectorLength; i++) {
      vector.push(0);
    }

    if (tokens === null) {
      return vector;
    }

    tokens.forEach(function (token) {
      if (vocabulary.hasOwnProperty(token)) {
        vector[vocabulary[token]] += 1;
      }
    });

    return vector;
  }
}

angular
  .module('oppia')
  .factory(
    'CountVectorizerService',
    downgradeInjectable(CountVectorizerService)
  );
