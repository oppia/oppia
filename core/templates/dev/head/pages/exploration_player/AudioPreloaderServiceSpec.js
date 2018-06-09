// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the audio preloader service.
 */

describe('Audio preloader service', function() {
  beforeEach(function() {
    module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          is_terminal: false
        },
        Continue: {
          is_terminal: false
        },
        EndExploration: {
          is_terminal: true
        }
      });
    });
  });

  var aps, atls, eof, ecs;
  var $httpBackend = null;
  var $rootScope = null;
  var explorationDict;
  var requestUrl1, requestUrl2, requestUrl3, requestUrl4;
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    aps = $injector.get('AudioPreloaderService');
    atls = $injector.get('AudioTranslationLanguageService');
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ExplorationContextService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
    explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      states: {
        'State 1': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 1 Content</p>'
          },
          content_ids_to_audio_translations: {
            'content': {
              en: {
                filename: 'en-1.mp3',
                file_size_bytes: 120000,
                needs_update: false
              }
            },
            'default_outcome': {}
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
          content_ids_to_audio_translations: {
            'content': {
              en: {
                filename: 'en-3.mp3',
                file_size_bytes: 120000,
                needs_update: false
              }
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          classifier_model_id: null
        },
        'State 2': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 2 Content</p>'
          },
          content_ids_to_audio_translations: {
            'content': {
              en: {
                filename: 'en-2.mp3',
                file_size_bytes: 120000,
                needs_update: false
              }
            },
            'default_outcome': {}
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          classifier_model_id: null
        },
        Introduction: {
          param_changes: [],
          content: {
            content_id: 'contnet',
            html: '<p>Introduction Content</p>',
          },
          content_ids_to_audio_translations: {
            'content': {
              en: {
                filename: 'en-0.mp3',
                file_size_bytes: 120000,
                needs_update: false
              }
            },
            'default_outcome':{},
            'feedback_1': {}
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: ''
              }
            },
            solution: null,
            answer_groups: [{
              rule_specs: [{
                inputs: {
                  x: '1'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 2',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 2</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            hints: []
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    requestUrl1 = UrlInterpolationService.interpolateUrl(
      '/audiohandler/<exploration_id>/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-0.mp3'
      });
    requestUrl2 = UrlInterpolationService.interpolateUrl(
      '/audiohandler/<exploration_id>/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-1.mp3'
      });
    requestUrl3 = UrlInterpolationService.interpolateUrl(
      '/audiohandler/<exploration_id>/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-2.mp3'
      });
    requestUrl4 = UrlInterpolationService.interpolateUrl(
      '/audiohandler/<exploration_id>/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-3.mp3'
      });
  }));

  it('should maintain the correct number of download requests in queue',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'audio data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'audio data 2');
      $httpBackend.expect('GET', requestUrl3).respond(201, 'audio data 3');
      $httpBackend.expect('GET', requestUrl4).respond(201, 'audio data 4');
      var exploration = eof.createFromBackendDict(explorationDict);
      aps.init(exploration);
      atls.init(['en'], 'en', 'en');
      aps.kickOffAudioPreloader(exploration.getInitialState().name);

      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
      expect(aps.isLoadingAudioFile('en-0.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-1.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(false);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(2);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(1);
      expect(aps.isLoadingAudioFile('en-0.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-1.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(0);
    });

  it('should properly restart pre-loading from a new state', function() {
    var exploration = eof.createFromBackendDict(explorationDict);
    aps.init(exploration);
    atls.init(['en'], 'en', 'en');
    aps.kickOffAudioPreloader(exploration.getInitialState().name);
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
    aps.restartAudioPreloader('State 3');
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(1);
    expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
    aps.restartAudioPreloader('State 2');
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(2);
    expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(true);
    expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
  });
});
