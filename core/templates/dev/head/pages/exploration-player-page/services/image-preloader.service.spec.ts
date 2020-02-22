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

// TODO(#7222): Remove the following block of unnnecessary imports once
// image-preloader.service.ts is upgraded to Angular 8.
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AudioFileObjectFactory } from
  'domain/utilities/AudioFileObjectFactory';
import { FileDownloadRequestObjectFactory } from
  'domain/utilities/FileDownloadRequestObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImageFileObjectFactory } from
  'domain/utilities/ImageFileObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { ParamTypeObjectFactory } from
  'domain/exploration/ParamTypeObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');

describe('Image preloader service', function() {
  var abas = null;
  var ips = null;
  var eof = null;
  var ecs = null;
  var ifof = null;
  var $httpBackend = null;
  var UrlInterpolationService = null;
  var $rootScope = null;
  var explorationDict = null;
  var exploration = null;
  var requestUrl1 = null;
  var requestUrl2 = null;
  var requestUrl3 = null;
  var requestUrl4 = null;

  beforeEach(function() {
    angular.mock.module('oppia');
    angular.mock.module('oppia', function($provide) {
      $provide.value(
        'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
          new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
          new RuleObjectFactory()));
      $provide.value('AudioFileObjectFactory', new AudioFileObjectFactory());
      $provide.value(
        'FileDownloadRequestObjectFactory',
        new FileDownloadRequestObjectFactory());
      $provide.value('FractionObjectFactory', new FractionObjectFactory());
      $provide.value(
        'HintObjectFactory', new HintObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value('ImageFileObjectFactory', new ImageFileObjectFactory());
      $provide.value(
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value(
        'ParamSpecObjectFactory',
        new ParamSpecObjectFactory(new ParamTypeObjectFactory()));
      $provide.value(
        'ParamSpecsObjectFactory',
        new ParamSpecsObjectFactory(
          new ParamSpecObjectFactory(new ParamTypeObjectFactory())));
      $provide.value('ParamTypeObjectFactory', new ParamTypeObjectFactory());
      $provide.value(
        'RecordedVoiceoversObjectFactory',
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
      $provide.value('RuleObjectFactory', new RuleObjectFactory());
      $provide.value(
        'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
      $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
      $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
      $provide.value(
        'WrittenTranslationObjectFactory',
        new WrittenTranslationObjectFactory());
      $provide.value(
        'WrittenTranslationsObjectFactory',
        new WrittenTranslationsObjectFactory(
          new WrittenTranslationObjectFactory()));
    });
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
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
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    ips = $injector.get('ImagePreloaderService');
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    abas = $injector.get('AssetsBackendApiService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    spyOn(ecs, 'getEntityType').and.returnValue('exploration');
    spyOn(ecs, 'getEntityId').and.returnValue('1');
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
            content_id: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
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
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {}
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
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {}
            }
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
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
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {}
            }
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
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {}
            }
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    requestUrl1 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
      {
        exploration_id: '1',
        filename: 'sIMChoice1_height_32_width_42.png'
      });
    requestUrl2 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
      {
        exploration_id: '1',
        filename: 'sIMChoice2_height_30_width_40.png'
      });
    requestUrl3 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
      {
        exploration_id: '1',
        filename: 'sIOFeedback_height_50_width_50.png'
      });
    requestUrl4 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
      {
        exploration_id: '1',
        filename: 's6Hint1_height_60_width_60.png'
      });

    exploration = eof.createFromBackendDict(explorationDict);
  }));

  it('should be in exploration player after init is called', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    expect(ips.inExplorationPlayer()).toBe(true);
  });

  it('should not be in exploration player before init is called', function() {
    expect(ips.inExplorationPlayer()).toBe(false);
  });

  it('should maintain the correct number of download requests in queue',
    function() {
      ips.init(exploration);
      ips.kickOffImagePreloader(exploration.getInitialState().name);

      $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
      $httpBackend.expect('GET', requestUrl3).respond(201, 'image data 3');
      $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
      // Max files to download simultaneously is 3.
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
      expect(ips.isLoadingImageFile(
        's6Hint1_height_60_width_60.png')).toBe(true);
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
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    ips.restartImagePreloader('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
  });

  it('should start preloader when state changes and there is at least' +
    ' one file downloading', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(false);
    ips.onStateChange('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
    $httpBackend.flush(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(false);
  });

  it('should not start preloader when state changes and there is no' +
    ' file downloading', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
    $httpBackend.expect('GET', requestUrl3).respond(201, 'image data 3');
    $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    $httpBackend.flush(3);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    ips.onStateChange('State 6');
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
    $httpBackend.flush(1);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(false);
  });

  it('should check that there is sync between AssetsBackendApi Service and' +
    'ImagePreloader Service', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    var filenamesOfImageCurrentlyDownloading = (
      ips.getFilenamesOfImageCurrentlyDownloading());
    var imageFilesCurrentlyBeingRequested = (
      abas.getAssetsFilesCurrentlyBeingRequested().image
    );
    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    for (var x in filenamesOfImageCurrentlyDownloading) {
      expect(filenamesOfImageCurrentlyDownloading[x]).toBe(
        imageFilesCurrentlyBeingRequested[x].filename);
    }
  });

  it('should maintain the filenames of image which failed to download',
    function() {
      ips.init(exploration);
      ips.kickOffImagePreloader(exploration.getInitialState().name);

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
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    var dimensions1 = ips.getDimensionsOfImage(
      'sIOFeedback_height_50_width_50.png');
    expect(dimensions1.width).toBe(50);
    expect(dimensions1.height).toBe(50);
    var dimensions2 = ips.getDimensionsOfImage(
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

  it('should get image url', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
    $httpBackend.expect('GET', requestUrl3).respond(201, 'image data 3');
    $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isLoadingImageFile(
      'sIMChoice1_height_32_width_42.png')).toBe(true);
    $httpBackend.flush(1);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);

    expect(ips.isLoadingImageFile(
      'sIMChoice1_height_32_width_42.png')).toBe(false);

    var sucessHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    ips.getImageUrl('sIMChoice1_height_32_width_42.png').then(
      sucessHandler, failHandler);
    $httpBackend.flush();

    expect(sucessHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should get image url when first loading fails and the second' +
    ' one is successful', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    $httpBackend.expect('GET', requestUrl1).respond(404);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isInFailedDownload(
      'sIMChoice1_height_32_width_42.png')).toBe(false);
    $httpBackend.flush(1);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);

    expect(ips.isInFailedDownload(
      'sIMChoice1_height_32_width_42.png')).toBe(true);

    var sucessHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    ips.getImageUrl('sIMChoice1_height_32_width_42.png').then(
      sucessHandler, failHandler);
    $httpBackend.flush();

    expect(ips.isInFailedDownload(
      'sIMChoice1_height_32_width_42.png')).toBe(false);
    expect(sucessHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should not get image url when loading image fails in both requests',
    function() {
      ips.init(exploration);
      ips.kickOffImagePreloader(exploration.getInitialState().name);

      $httpBackend.expect('GET', requestUrl1).respond(404);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      expect(ips.isInFailedDownload(
        'sIMChoice1_height_32_width_42.png')).toBe(false);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);

      expect(ips.isInFailedDownload(
        'sIMChoice1_height_32_width_42.png')).toBe(true);

      var sucessHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', requestUrl1).respond(404);
      ips.getImageUrl('sIMChoice1_height_32_width_42.png').then(
        sucessHandler, failHandler);
      $httpBackend.flush();

      expect(ips.isInFailedDownload(
        'sIMChoice1_height_32_width_42.png')).toBe(true);
      expect(sucessHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should call the successful callback when loading an image after' +
    ' trying to get its image url', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    ips.getImageUrl('sIMChoice1_height_32_width_42.png').then(
      successHandler, failHandler);

    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isLoadingImageFile(
      'sIMChoice1_height_32_width_42.png')).toBe(true);
    $httpBackend.flush(1);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the failed callback when loading an image fails after' +
  ' trying to get its image url', function() {
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);

    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    ips.getImageUrl('sIMChoice1_height_32_width_42.png').then(
      successHandler, failHandler);

    $httpBackend.expect('GET', requestUrl1).respond(404);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isInFailedDownload(
      'sIMChoice1_height_32_width_42.png')).toBe(false);
    $httpBackend.flush(1);
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);
    expect(ips.isInFailedDownload(
      'sIMChoice1_height_32_width_42.png')).toBe(true);

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
