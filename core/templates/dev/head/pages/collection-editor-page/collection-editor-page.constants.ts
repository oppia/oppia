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

// TODO(bhenning): These constants should be provided by the backend.

export class CollectionEditorPageConstants {
  public static EDITABLE_COLLECTION_DATA_URL_TEMPLATE =
    '/collection_editor_handler/data/<collection_id>';
  public static COLLECTION_RIGHTS_URL_TEMPLATE =
    '/collection_editor_handler/rights/<collection_id>';

  public static COLLECTION_TITLE_INPUT_FOCUS_LABEL =
    'collectionTitleInputFocusLabel';

  public static EVENT_COLLECTION_INITIALIZED = 'collectionInitialized';
  public static EVENT_COLLECTION_REINITIALIZED = 'collectionReinitialized';
}
