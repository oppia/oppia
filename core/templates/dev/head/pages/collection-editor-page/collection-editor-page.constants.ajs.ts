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
 * @fileoverview Constants for the collection editor page.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { CollectionEditorPageConstants } from
  'pages/collection-editor-page/collection-editor-page.constants';

// TODO(bhenning): These constants should be provided by the backend.

angular.module('oppia').constant(
  'EDITABLE_COLLECTION_DATA_URL_TEMPLATE',
  CollectionEditorPageConstants.EDITABLE_COLLECTION_DATA_URL_TEMPLATE);
angular.module('oppia').constant(
  'COLLECTION_RIGHTS_URL_TEMPLATE',
  CollectionEditorPageConstants.COLLECTION_RIGHTS_URL_TEMPLATE);

angular.module('oppia').constant(
  'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
  CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL);

angular.module('oppia').constant(
  'EVENT_COLLECTION_INITIALIZED',
  CollectionEditorPageConstants.EVENT_COLLECTION_INITIALIZED);
angular.module('oppia').constant(
  'EVENT_COLLECTION_REINITIALIZED',
  CollectionEditorPageConstants.EVENT_COLLECTION_REINITIALIZED);
