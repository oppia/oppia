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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { StateContentEditorComponent } from './state-content-editor.component';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateContentService } from 'components/state-editor/state-editor-properties-services/state-content.service';
// import { ExplorationStatesService } from 
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { EditabilityService } from 'services/editability.service';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';

describe('StateHintsEditorComponent', () => {
  let component: StateContentEditorComponent;
  let fixture: ComponentFixture<StateContentEditorComponent>;
  let editabilityService: EditabilityService;
  let stateContentService: StateContentService;
  let explorationStatesService: ExplorationStatesService;
  let changeListService: ChangeListService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;

  var _getContent = function(contentId, contentString) {
    return SubtitledHtml.createFromBackendDict({
      content_id: contentId,
      html: contentString
    });
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StateContentEditorComponent
      ],
      providers: [
        ChangeListService,
        StateContentService,
        ExternalSaveService,
        EditabilityService,
        StateRecordedVoiceoversService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateContentEditorComponent);
    component = fixture.componentInstance;

    editabilityService = TestBed.inject(EditabilityService);
    stateContentService = TestBed.inject(StateContentService);
    externalSaveService = TestBed.inject(ExternalSaveService);
    changeListService = TestBed.inject(ChangeListService);
    stateRecordedVoiceoversService = TestBed.inject(
      StateRecordedVoiceoversService);

    var recordedVoiceOversDict = {
      voiceovers_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {}
      }
    };

    stateContentService.init('Third State', _getContent('content', 'This is some content.'));
    stateRecordedVoiceoversService.init(
      'Third State', RecordedVoiceovers.createFromBackendDict(recordedVoiceOversDict));
    editabilityService.markEditable();
    externalSaveService.init({
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
