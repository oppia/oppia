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
 * @fileoverview Unit tests for the image preloader service.
 */

describe('Image preloader service', function() {
  beforeEach(function() {
    module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          is_terminal: false
        },
        ItemSelectionInput: {
          is_terminal: false
        },
        MultipleChoiceInput: {
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

  var abas, ips, eof, ecs;
  var $httpBackend = null;
  var $rootScope = null;
  var explorationDict;
  var requestUrl1, requestUrl2, requestUrl3, requestUrl4, requestUrl5;
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    ips = $injector.get('ImagePreloaderService');
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    abas = $injector.get('AssetsBackendApiService');
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
            html: '',
            audio_translations: {}
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {}
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
            html: 'Congratulations, you have finished!'
          },
          content_ids_to_audio_translations: {
            content: {}
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
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Multiple Choice'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: 'Try Again!'
              }
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  '<p> Go to ItemSelection <oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;' +
                  'sIMChoice1_height_32_width_42.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>',
                  '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;' +
                  'sIMChoice2_height_30_width_40.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                ]
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 6',
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>We are going to ItemSelection' +
                          '<oppia-noninteractive-image filepath-with-value=' +
                          '"&amp;quot;sIOFeedback_height_50_width_50.png' +
                          '&amp;quot;"></oppia-noninteractive-image></p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 0
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feedback_2',
                    html: "Let's go to state 1 ImageAndRegion"
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 1
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ],
            hints: [],
            solution: null
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {},
            hint_1: {}
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
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
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
              }
            }],
            hints: [{
              hint_content: {
                content_id: 'hint_1',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6Hint1_height_60_width_60.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            }],
            solution: null,
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    requestUrl1 = UrlInterpolationService.interpolateUrl(
      '/imagehandler/<exploration_id>/<filename>', {
        exploration_id: '1',
        filename: 'sIMChoice1_height_32_width_42.png'
      });
    requestUrl2 = UrlInterpolationService.interpolateUrl(
      '/imagehandler/<exploration_id>/<filename>', {
        exploration_id: '1',
        filename: 'sIMChoice2_height_30_width_40.png'
      });
    requestUrl3 = UrlInterpolationService.interpolateUrl(
      '/imagehandler/<exploration_id>/<filename>', {
        exploration_id: '1',
        filename: 'sIOFeedback_height_50_width_50.png'
      });
    requestUrl4 = UrlInterpolationService.interpolateUrl(
      '/imagehandler/<exploration_id>/<filename>', {
        exploration_id: '1',
        filename: 's6Hint1_height_60_width_60.png'
      });

    var exploration = eof.createFromBackendDict(explorationDict);
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);
  }));

  it('should maintain the correct number of download requests in queue',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
      $httpBackend.expect('GET', requestUrl3).respond(201, 'image data 3');
      $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      expect(ips.isLoadingImageFile(
        'sIMChoice1_height_32_width_42.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        'sIMChoice2_height_30_width_40.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        'sIOFeedback_height_50_width_50.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        's6Hint1_height_60_width_60.png')).toBe(false);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(2);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);
      expect(ips.isLoadingImageFile(
        'sIMChoice1_height_32_width_42.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        'sIMChoice2_height_30_width_40.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        'sIOFeedback_height_50_width_50.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        's6Hint1_height_60_width_60.png')).toBe(false);
    });

  it('should properly restart pre-loading from a new state', function() {
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    ips.restartImagePreloader('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
  });

  it('should verify that preloader starts when state changes', function() {
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(false);
    ips.onStateChange('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
  });

  it('should check that there is sync between AssetsBackendApi Service and' +
    'ImagePreloader Service', function() {
    var filenamesOfImageCurrentlyDownloading = (
      ips.getFilenamesOfImageCurrentlyDownloading());
    var imageFilesCurrentlyBeingRequested = (
      abas.getAssetsFilesCurrentlyBeingRequested().image
    );
    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    for (x in filenamesOfImageCurrentlyDownloading) {
      expect(filenamesOfImageCurrentlyDownloading[x]).toBe(
        imageFilesCurrentlyBeingRequested[x].filename);
    }
  });

  it('should maintain the filenames of image which failed to download',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
      $httpBackend.expect('GET', requestUrl3).respond(404);
      $httpBackend.expect('GET', requestUrl4).respond(408);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(3);
      expect(ips.isInFailedDownload(
        'sIOFeedback_height_50_width_50.png')).toBe(true);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
      $httpBackend.flush(1);
      expect(ips.isInFailedDownload(
        's6Hint1_height_60_width_60.png')).toBe(true);
      ips.restartImagePreloader('State 6');
      expect(ips.isInFailedDownload(
        's6Hint1_height_60_width_60.png')).toBe(false);
    });

  it('should calculate the dimensions of the image file', function() {
    dimensions1 = ips.getDimensionsOfImage(
      'sIOFeedback_height_50_width_50.png');
    expect(dimensions1.width).toBe(50);
    expect(dimensions1.height).toBe(50);
    dimensions2 = ips.getDimensionsOfImage(
      'sIOFeedback_height_30_width_45_height_56_width_56.png');
    expect(dimensions2.width).toBe(56);
    expect(dimensions2.height).toBe(56);
    expect(function() {
      ips.getDimensionsOfImage(
        's6Hint1_height_width_60.png');
    }).toThrowError(
      /it does not contain dimensions/);
    expect(function() {
      ips.getDimensionsOfImage(
        'sol_height_ds_width_60.png');
    }).toThrowError(
      /it does not contain dimensions/);
  });
});
