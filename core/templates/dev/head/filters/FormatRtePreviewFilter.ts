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
 * @fileoverview FormatRtePreview filter for Oppia.
 */

/* The following filter replaces each RTE element occurrence in the input html
   by its corresponding name in square brackets and returns a string
   which contains the name in the same location as in the input html.
   eg: <p>Sample1 <oppia-noninteractive-math></oppia-noninteractive-math>
        Sample2 </p>
   will give as output: Sample1 [Math] Sample2 */
oppia.filter('formatRtePreview', ['$filter', function($filter) {
  return function(html) {
    html = html.replace(/&nbsp;/ig, ' ');
    html = html.replace(/&quot;/ig, '');
    // Replace all html tags other than <oppia-noninteractive-**> ones to ''.
    html = html.replace(/<(?!oppia-noninteractive\s*?)[^>]+>/g, '');
    var formattedOutput = html.replace(/(<([^>]+)>)/g, function(rteTag) {
      var replaceString = $filter(
        'capitalize')(rteTag.split('-')[2].split(' ')[0]);
      if (replaceString[replaceString.length - 1] === '>') {
        replaceString = replaceString.slice(0, -1);
      }
      return ' [' + replaceString + '] ';
    });
    return formattedOutput.trim();
  };
}]);
