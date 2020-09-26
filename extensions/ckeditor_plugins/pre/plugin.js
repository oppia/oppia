// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Adds pre plugin to CKEditor RTE.
 */

CKEDITOR.plugins.add('pre', {
  icons: 'pre',

  init: function(editor) {
    var style = new CKEDITOR.style({element: 'pre'}, null);

    editor.addCommand(
      'pre', new CKEDITOR.styleCommand(style));

    // This part will provide toolbar button highlighting in editor.
    editor.attachStyleStateChange(style, function(state) {
      !editor.readOnly && editor.getCommand('pre').setState(state);
    });

    editor.ui.addButton('Pre', {
      label: 'Pre',
      command: 'pre',
      toolbar: 'insert'
    });
  }
});
