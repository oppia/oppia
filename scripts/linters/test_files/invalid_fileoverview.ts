// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
// This file has missing fileoverview.
const CodeMirror = require('node_modules/codemirror/lib/codemirror.js');
Object.defineProperty(window, 'CodeMirror', {
  value: CodeMirror,
  writable: false
});

require('node_modules/codemirror/mode/javascript/javascript.js');
require('node_modules/codemirror/mode/python/python.js');
require('node_modules/codemirror/mode/yaml/yaml.js');
require('static/ui-codemirror-5d04fa/src/ui-codemirror.js');
require('static/diff-match-patch-1.0.0/diff_match_patch.js');
