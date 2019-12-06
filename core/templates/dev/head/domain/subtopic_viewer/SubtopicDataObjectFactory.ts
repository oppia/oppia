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
 * @fileoverview Factory for creating instances of frontend
 * subtopic data domain objects.
 */

require('domain/topic/SubtopicPageContentsObjectFactory.ts');

angular.module('oppia').factory('SubtopicDataObjectFactory',
  ['SubtopicPageContentsObjectFactory',
    function(SubtopicPageContentsObjectFactory) {
      var SubtopicData = function(
          subtopicTitle, pageContents) {
        this._subtopic_title = subtopicTitle;
        console.error("Hi I'm Error");
        // this._page_contents = SubtopicPageContentsObjectFactory.
        //   createFromBackendDict(pageContents);
        this.page_contents = pageContents;
      };

      // Instance methods

      SubtopicData.prototype.getSubtopicTitle = function() {
        return this._subtopic_title;
      };

      SubtopicData.prototype.getPageContents = function() {
        return this._page_contents;
      };

      // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
      /* eslint-disable dot-notation */
      SubtopicData['createFromBackendDict'] = function(
          subtopicDataBackendDict) {
        /* eslint-enable dot-notation */
        return new SubtopicData(
          subtopicDataBackendDict.subtopic_title,
          subtopicDataBackendDict.page_contents
        );
      };

      return SubtopicData;
    }]);
