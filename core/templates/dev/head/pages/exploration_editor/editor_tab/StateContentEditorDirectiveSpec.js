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
 * @fileoverview Unit tests for the state content editor directive.
 */

describe('State content editor directive', function() {
  var outerScope, ctrlScope, shof, cls, scs, es, ess;

  var _getContent = function(contentString) {
    return shof.createFromBackendDict({
      html: contentString,
      audio_translations: {}
    });
  };

  beforeEach(module('directiveTemplates'));
  beforeEach(function() {
    module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS);

    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
  });

  beforeEach(inject(function($compile, $injector, $rootScope, $templateCache) {
    shof = $injector.get('SubtitledHtmlObjectFactory');
    cls = $injector.get('ChangeListService');
    scs = $injector.get('StateContentService');
    es = $injector.get('EditabilityService');
    ess = $injector.get('ExplorationStatesService');

    scs.init('Third State', _getContent('This is some content.'));
    es.markEditable();
    ess.init({
      'First State': {
        content: {
          html: 'First State Content',
          audio_translations: {}
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: []
      },
      'Second State': {
        content: {
          html: 'Second State Content',
          audio_translations: {}
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: []
      },
      'Third State': {
        content: {
          html: 'This is some content.',
          audio_translations: {}
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: [{
          name: 'comparison',
          generator_id: 'Copier',
          customization_args: {
            value: 'something clever',
            parse_with_jinja: false
          }
        }]
      }
    });

    var templateHtml = $templateCache.get(
      '/pages/exploration_editor/editor_tab/' +
      'state_content_editor_directive.html');
    $compile(templateHtml, $rootScope);
    $rootScope.$digest();

    outerScope = $rootScope.$new();
    outerScope.onSaveContentFn = jasmine.createSpy('onSaveContentFn');
    var elem = angular.element(
      '<state-content-editor on-save-content-fn="onSaveContentFn">' +
      '</state-content-editor>');
    var compiledElem = $compile(elem)(outerScope);
    outerScope.$digest();
    ctrlScope = compiledElem[0].getControllerScope();
  }));

  it('should start with the content editor not being open', function() {
    expect(ctrlScope.contentEditorIsOpen).toBe(false);
  });

  it('should correctly handle no-op edits', function() {
    expect(ctrlScope.contentEditorIsOpen).toBe(false);
    expect(scs.savedMemento).toEqual(_getContent('This is some content.'));
    ctrlScope.openStateContentEditor();
    expect(ctrlScope.contentEditorIsOpen).toBe(true);
    scs.displayed = _getContent('This is some content.');
    ctrlScope.onSaveContentButtonClicked();

    expect(ctrlScope.contentEditorIsOpen).toBe(false);
    expect(cls.getChangeList()).toEqual([]);
  });

  it('should check that content edits are saved correctly', function() {
    expect(cls.getChangeList()).toEqual([]);

    ctrlScope.openStateContentEditor();
    scs.displayed = _getContent('babababa');
    ctrlScope.onSaveContentButtonClicked();
    expect(cls.getChangeList().length).toBe(1);
    expect(cls.getChangeList()[0].new_value.html).toEqual('babababa');
    expect(cls.getChangeList()[0].old_value.html).toEqual(
      'This is some content.');

    ctrlScope.openStateContentEditor();
    scs.displayed = _getContent(
      'And now for something completely different.');
    ctrlScope.onSaveContentButtonClicked();
    expect(cls.getChangeList().length).toBe(2);
    expect(cls.getChangeList()[1].new_value.html)
      .toEqual('And now for something completely different.');
    expect(cls.getChangeList()[1].old_value.html).toEqual('babababa');
  });

  it('should not save changes to content when edit is cancelled', function() {
    var contentBeforeEdit = angular.copy(scs.savedMemento);

    scs.displayed = _getContent('Test Content');
    ctrlScope.cancelEdit();
    expect(ctrlScope.contentEditorIsOpen).toBe(false);
    expect(scs.savedMemento).toEqual(contentBeforeEdit);
    expect(scs.displayed).toEqual(contentBeforeEdit);
  });

  it('should call the callback function on-save', function() {
    ctrlScope.onSaveContentButtonClicked();
    expect(outerScope.onSaveContentFn).toHaveBeenCalled();
  });
});
