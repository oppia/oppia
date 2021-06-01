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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');
require('services/editability.service.ts');

describe('State content editor directive', function() {
  var outerScope, ctrlScope, shof, cls, scs, es, ess, srvos;
  var mockExplorationData;

  var _getContent = function(contentId, contentString) {
    return shof.createFromBackendDict({
      content_id: contentId,
      html: contentString
    });
  };

  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(function() {
    angular.mock.module('oppia', TranslatorProviderForTests);

    mockExplorationData = {
      explorationId: 0,
      autosaveChangeListAsync: function() {}
    };
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(
    function($compile, $injector, $rootScope, $templateCache) {
      cls = $injector.get('ChangeListService');
      srvos = $injector.get('StateRecordedVoiceoversService');
      scs = $injector.get('StateContentService');
      es = $injector.get('EditabilityService');
      ess = $injector.get('ExplorationStatesService');

      var rvoDict = {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {}
        }
      };

      scs.init('Third State', _getContent('content', 'This is some content.'));
      srvos.init(
        'Third State', RecordedVoiceovers.createFromBackendDict(rvoDict));
      es.markEditable();
      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Second State': {
          content: {
            content_id: 'content',
            html: 'Second State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Third State': {
          content: {
            content_id: 'content',
            html: 'This is some content.'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
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
          }],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        }
      });

      var templateHtml = $templateCache.get(
        '/pages/exploration_editor/editor_tab/' +
        'state_content_editor_directive.html');
      $compile(templateHtml, $rootScope);
      $rootScope.$digest();

      outerScope = $rootScope.$new();
      outerScope.saveStateContent = jasmine.createSpy('saveStateContent');
      outerScope.showMarkAllAudioAsNeedingUpdateModalIfRequired = (
        jasmine.createSpy(''));
      var elem = angular.element(
        '<state-content-editor ' +
        'on-save-state-content="saveStateContent" ' +
        'show-mark-all-audio-as-needing-update-modal-if-required=' +
        '"showMarkAllAudioAsNeedingUpdateModalIfRequired">' +
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
    expect(scs.savedMemento).toEqual(_getContent(
      'content', 'This is some content.'));
    ctrlScope.openStateContentEditor();
    expect(ctrlScope.contentEditorIsOpen).toBe(true);
    scs.displayed = _getContent('content', 'This is some content.');
    ctrlScope.onSaveContentButtonClicked();

    expect(ctrlScope.contentEditorIsOpen).toBe(false);
    expect(cls.getChangeList()).toEqual([]);
  });

  it('should check that content edits are saved correctly', function() {
    expect(cls.getChangeList()).toEqual([]);

    ctrlScope.openStateContentEditor();
    scs.displayed = _getContent('content', 'babababa');
    ctrlScope.onSaveContentButtonClicked();
    expect(outerScope.saveStateContent).toHaveBeenCalled();

    ctrlScope.openStateContentEditor();
    scs.displayed = _getContent(
      'content', 'And now for something completely different.');
    ctrlScope.onSaveContentButtonClicked();
    expect(outerScope.saveStateContent).toHaveBeenCalled();
    expect(
      outerScope.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalled();
  });

  it('should not save changes to content when edit is cancelled', function() {
    var contentBeforeEdit = angular.copy(scs.savedMemento);

    scs.displayed = _getContent('content', 'Test Content');
    ctrlScope.cancelEdit();
    expect(ctrlScope.contentEditorIsOpen).toBe(false);
    expect(scs.savedMemento).toEqual(contentBeforeEdit);
    expect(scs.displayed).toEqual(contentBeforeEdit);
  });

  it('should call the callback function on-save', function() {
    ctrlScope.onSaveContentButtonClicked();
    expect(outerScope.saveStateContent).toHaveBeenCalled();
  });
});
