"use strict";
// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Utilities for using the Image component during end-to-end
 * testing with Protractor.js
 */
var protractor_1 = require("protractor");
var objects = require('../../objects/protractor.js');
var customizeComponent = function (modal, filepath, name) {
    modal.element(protractor_1.by.tagName('button')).click();
    var filepathEditor = objects.FilepathEditor(modal.element(protractor_1.by.tagName('filepath-editor')));
    filepathEditor.upload(filepath);
    filepathEditor.setName(name);
};
var expectComponentDetailsToMatch = function (elem, name) {
    // The original filepath is not recorded and so cannot be checked.
    expect(elem.getAttribute('filepath-with-value')).toMatch(name);
};
exports.customizeComponent = customizeComponent;
exports.expectComponentDetailsToMatch = expectComponentDetailsToMatch;
