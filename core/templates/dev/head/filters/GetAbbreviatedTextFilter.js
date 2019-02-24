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
 * @fileoverview GetAbbreviatedText filter for Oppia.
 */

oppia.filter('getAbbreviatedText', [function() {
  return function(text, characterCount) {
    if (text.length > characterCount) {
      var subject = text.substr(0, characterCount);

      if (subject.indexOf(' ') !== -1) {
        subject = subject.split(' ').slice(0, -1).join(' ');
      }
      return subject.concat('...');
    }
    return text;
  };
}]);
