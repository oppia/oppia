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

/**
 * @fileoverview End-to-end tests for rich-text components.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var general = require('../protractor_utils/general.js');
var forms = require('../protractor_utils/forms.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var editor = require('../protractor_utils/editor.js');
var player = require('../protractor_utils/player.js');

describe('rich-text components', function() {
  it('should display correctly', function() {
    users.createUser('user11@example.com', 'user11');
    users.login('user11@example.com')

    workflow.createExploration('RTE components', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendBoldText('bold');
      richTextEditor.appendPlainText(' ');
      richTextEditor.addRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      // TODO (Jacob) add test for image RTE component
      richTextEditor.addRteComponent('Link', 'http://google.com/', true);
      richTextEditor.addRteComponent('Math', 'abc');
      richTextEditor.addRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextEditor.addRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
    })
    editor.setInteraction('TextInput');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readBoldText('bold');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent(
        'Collapsible', 'title', forms.toRichText('inner'));
      richTextChecker.readRteComponent('Link', 'http://google.com/', true);
      richTextChecker.readRteComponent('Math', 'abc');
      richTextChecker.readRteComponent('Tabs', [{
        title: 'title 1',
        content: forms.toRichText('contents 1')
      }, {
        title: 'title 1',
        content: forms.toRichText('contents 2')
      }]);
      richTextChecker.readRteComponent('Video', 'ANeHmk22a6Q', 10, 100, false);
    });


    users.logout();
  });

  it('should allow rich text inside extensions', function() {
    users.createUser('user12@example.com', 'user12');
    users.login('user12@example.com')

    workflow.createExploration('RTE components', 'maths');

    editor.setContent(function(richTextEditor) {
      richTextEditor.appendItalicText('slanted');
      richTextEditor.appendPlainText(' ');
      richTextEditor.addRteComponent(
          'Collapsible', 'heading', function(collapsibleEditor) {
        collapsibleEditor.appendBoldText('boldtext');
        collapsibleEditor.appendPlainText(' ');
        collapsibleEditor.addRteComponent('Math', 'xyz');
      });
    });

    editor.setInteraction('EndExploration');
    editor.saveChanges();

    general.moveToPlayer();
    player.expectContentToMatch(function(richTextChecker) {
      richTextChecker.readItalicText('slanted');
      richTextChecker.readPlainText(' ');
      richTextChecker.readRteComponent(
          'Collapsible', 'heading', function(collapsibleChecker) {
        collapsibleChecker.readBoldText('boldtext');
        collapsibleChecker.readPlainText(' ');
        collapsibleChecker.readRteComponent('Math', 'xyz');
      });
    });

    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      // TODO (Jacob) Remove when
      // https://code.google.com/p/google-cast-sdk/issues/detail?id=309 is fixed
      'chrome-extension://boadgeojelhgndaghljhdicfkmllpafd/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://dliochdbjfkdbacpmhlcpmleaejidimm/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://hfaagokkkhdbgiakmmlclaapfelnkoah/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://enhhojjnijigcajfphajepfemndkmdlo/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED',
      'chrome-extension://eojlgccfgnjlphjnlopmadngcgmmdgpk/' +
        'cast_sender.js 0:0 Failed to load resource: net::ERR_FAILED'
    ]);
  });
});
