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
 * Tokenizer for TextInput.
 *
 * Note: This is a simple tokenizer for tokenizing text input. The parameter
 * n_grams is used for deciding if we need to add n_gram tokens other than
 * the unigram tokens. As of now, we are only interested in unigrams but if
 * needed in the future, this tokenizer should be able to generate n-grams
 * also.
 *
 * For reference: https://github.com/scikit-learn/scikit-learn/
 *     blob/master/sklearn/feature_extraction/text.py#L541
 */

// TODO(anmol): Add functionality to add n_grams, remove stop words.
oppia.factory('TextInputTokenizer', [
  '$log', function($log) {
    return {
      generateTokens: function(textInput) {
        var tokenizedTextInput;
        // The default regexp select tokens of 2 or more alphanumeric
        // characters (punctuation is completely ignored and always treated
        // as a token separator).
        var tokenPattern = '\\b\\w\\w+\\b';
        var regexp = new RegExp(tokenPattern, 'g');
        tokenizedTextInput = textInput.match(regexp);
        return tokenizedTextInput;
      }
    };
  }]);
