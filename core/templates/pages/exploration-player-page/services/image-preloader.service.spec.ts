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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { Exploration, ExplorationBackendDict, ExplorationObjectFactory } from
  'domain/exploration/ExplorationObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';
import { ContentTranslationManagerService } from 'pages/exploration-player-page/services/content-translation-manager.service';
import { ImagePreloaderService } from
  'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

describe('Image preloader service', () => {
  let httpTestingController: HttpTestingController;
  let interactionAnswer: InteractionAnswer[] = ['Ans1'];

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  let assetsBackendApiService: AssetsBackendApiService;
  let imagePreloaderService: ImagePreloaderService;
  let explorationObjectFactory: ExplorationObjectFactory;
  let contextService: ContextService;
  let ctms: ContentTranslationManagerService;
  let svgSanitizerService: SvgSanitizerService;


  const initStateName = 'Introduction';
  const explorationDict: ExplorationBackendDict = {
    correctness_feedback_enabled: false,
    draft_change_list_id: 1,
    draft_changes: [],
    auto_tts_enabled: false,
    version: 1,
    is_version_of_draft_valid: true,
    language_code: 'en',
    title: 'My Title',
    init_state_name: 'Introduction',
    states: {
      'State 1': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>State 1 Content</p>'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-2.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            },
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
            dest_if_really_stuck: null,
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
        card_is_checkpoint: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        linked_skill_id: null,
        classifier_model_id: null,
        next_content_id_index: 0,
      },
      'State 3': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: 'Congratulations, you have finished!',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-4.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
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
        solicit_answer_details: false,
        card_is_checkpoint: false,
        written_translations: {
          translations_mapping: {
            content: {}
          }
        },
        linked_skill_id: null,
        classifier_model_id: null,
        next_content_id_index: 0,
      },
      'State 2': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>State 2 Content</p>'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-3.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            },
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
            dest_if_really_stuck: null,
            param_changes: [],
            labelled_as_correct: false,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
        card_is_checkpoint: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        linked_skill_id: null,
        classifier_model_id: null,
        next_content_id_index: 0,
      },
      Introduction: {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>Introduction Content</p>',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'en-1.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            },
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '<p>Try again.</p>'
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
              rule_type: 'Contains',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['1']
              }}
            }],
            outcome: {
              dest: 'State 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: "<p>Let's go to State 1</p>"
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            training_data: interactionAnswer,
            tagged_skill_misconception_id: null,
          }, {
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['2']
              }}
            }],
            outcome: {
              dest: 'State 2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: "<p>Let's go to State 2</p>"
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            training_data: interactionAnswer,
            tagged_skill_misconception_id: null,
          }],
          hints: []
        },
        solicit_answer_details: false,
        card_is_checkpoint: true,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        linked_skill_id: null,
        classifier_model_id: null,
        next_content_id_index: 0,
      }
    },
    param_specs: {},
    param_changes: [],
  };
  class mockReaderObject {
    result = null;
    onloadend: () => string;
    constructor() {
      this.onloadend = () => {
        return 'Fake onload executed';
      };
    }

    readAsDataURL(file: File) {
      this.onloadend();
      return 'The file is loaded';
    }
  }
  const filename1 = 'sIMChoice1_height_32_width_42.png';
  const filename2 = 'sIMChoice2_height_30_width_40.png';
  const filename3 = 'sIOFeedback_height_50_width_50.png';
  const filename4 = 's6Hint1_height_60_width_60.png';

  const requestUrl1 = (
    `/assetsdevhandler/exploration/1/assets/image/${filename1}`);
  const requestUrl2 = (
    `/assetsdevhandler/exploration/1/assets/image/${filename2}`);
  const requestUrl3 = (
    `/assetsdevhandler/exploration/1/assets/image/${filename3}`);
  const requestUrl4 = (
    `/assetsdevhandler/exploration/1/assets/image/${filename4}`);

  const imageBlob = new Blob(['image data'], {type: 'imagetype'});

  let exploration: Exploration;

  beforeEach(() => {
    imagePreloaderService = TestBed.get(ImagePreloaderService);
    explorationObjectFactory = TestBed.get(ExplorationObjectFactory);
    contextService = TestBed.get(ContextService);
    assetsBackendApiService = TestBed.get(AssetsBackendApiService);
    ctms = TestBed.get(ContentTranslationManagerService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);

    spyOn(contextService, 'getExplorationId').and.returnValue('1');
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(ctms, 'getTranslatedHtml').and.callFake(
      (unusedWrittenTranslations, unusedLanguageCode, content) => {
        return content.html;
      });

    exploration = (
      explorationObjectFactory.createFromBackendDict(explorationDict));
  });

  it('should be in exploration player after init is called', () => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    expect(imagePreloaderService.inExplorationPlayer()).toBeTrue();

    httpTestingController.expectOne(requestUrl1);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
  });

  it('should not be in exploration player before init is called', () => {
    expect(imagePreloaderService.inExplorationPlayer()).toBeFalse();
  });

  it('should maintain the correct number of download requests in queue',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      // Max files to download simultaneously is 3.
      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();
      expect(imagePreloaderService.isLoadingImageFile(filename2)).toBeTrue();
      expect(imagePreloaderService.isLoadingImageFile(filename3)).toBeTrue();
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl2).flush(imageBlob);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename2, filename3, filename4]);
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl3).flush(imageBlob);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename3, filename4]);

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4).flush(imageBlob);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename4]);

      flushMicrotasks();

      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([]);
      expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeFalse();
      expect(imagePreloaderService.isLoadingImageFile(filename2)).toBeFalse();
      expect(imagePreloaderService.isLoadingImageFile(filename3)).toBeFalse();
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();
    }));

  it('should properly restart pre-loading from a new state', () => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);

    imagePreloaderService.restartImagePreloader('State 6');

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();
  });

  it('should start preloader when state changes and there is at least' +
    ' one file downloading', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();

    imagePreloaderService.onStateChange('State 6');

    httpTestingController.expectOne(requestUrl4).flush(imageBlob);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

    flushMicrotasks();

    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();
  }));

  it('should not start preloader when state changes and there is no' +
    ' file downloading', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2).flush(imageBlob);
    httpTestingController.expectOne(requestUrl3).flush(imageBlob);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4).flush(imageBlob);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename4]);

    imagePreloaderService.onStateChange('State 6');
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

    flushMicrotasks();

    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();
  }));

  it('should check that there is sync between AssetsBackendApi Service and' +
    'ImagePreloader Service', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);
    flushMicrotasks();

    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(
      assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image.map(
        fileDownloadRequest => fileDownloadRequest.filename))
      .toEqual([filename1, filename2, filename3]);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);
    expect(
      assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image.map(
        fileDownloadRequest => fileDownloadRequest.filename))
      .toEqual([filename2, filename3, filename4]);
  }));

  it('should maintain the filenames of image which failed to download',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      httpTestingController.expectOne(requestUrl2).flush(imageBlob);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename1, filename2, filename3]);

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl3)
        .flush(imageBlob, {status: 404, statusText: 'Status Text'});
      httpTestingController.expectOne(requestUrl4);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename3, filename4]);
      expect(imagePreloaderService.isInFailedDownload(filename3)).toBeFalse();

      flushMicrotasks();

      expect(imagePreloaderService.isInFailedDownload(filename3)).toBeTrue();
      expect(imagePreloaderService.isInFailedDownload(filename4)).toBeFalse();

      imagePreloaderService.restartImagePreloader('State 6');

      httpTestingController.expectOne(requestUrl4)
        .flush(imageBlob, {status: 408, statusText: 'Status Text'});
      flushMicrotasks();

      expect(imagePreloaderService.isInFailedDownload(filename4)).toBeTrue();
    }));

  it('should calculate the dimensions of the image file', () => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);

    const dimensions1 = imagePreloaderService.getDimensionsOfImage(filename3);
    expect(dimensions1.width).toEqual(50);
    expect(dimensions1.height).toEqual(50);

    const dimensions2 = imagePreloaderService.getDimensionsOfImage(
      'sIOFeedback_height_30_width_45_height_56_width_56.png');
    expect(dimensions2.width).toEqual(56);
    expect(dimensions2.height).toEqual(56);

    expect(() => {
      imagePreloaderService.getDimensionsOfImage('s6Hint1_height_width_60.png');
    }).toThrowError(/it does not contain dimensions/);

    expect(() => {
      imagePreloaderService.getDimensionsOfImage('sol_height_ds_width_60.png');
    }).toThrowError(/it does not contain dimensions/);

    const mathSvgDimensions = imagePreloaderService.getDimensionsOfMathSvg(
      'mathImg_20207261338r3ir43lmfd_height_2d456_width_6d124_vertical_0' +
      'd231.svg');
    expect(mathSvgDimensions.height).toEqual(2.456);
    expect(mathSvgDimensions.width).toEqual(6.124);
    expect(mathSvgDimensions.verticalPadding).toEqual(0.231);

    expect(() => {
      imagePreloaderService.getDimensionsOfMathSvg(
        'mathImg_20207261338r3ir43lmfd_2d456_width_6d124_vertical_0d231.svg');
    }).toThrowError(/it does not contain dimensions/);
  });

  it('should fetch a non-SVG image', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeFalse();

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

    imagePreloaderService.getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should fetch an SVG image', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1).flush(
      new Blob(['svg image'], { type: 'image/svg+xml' }));
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeFalse();

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl');

    imagePreloaderService.getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(svgSanitizerService.getTrustedSvgResourceUrl).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should get image url when first loading fails and the second' +
    ' one is successful', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1)
      .flush(imageBlob, {status: 404, statusText: 'Status Text'});
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

    imagePreloaderService.getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    flushMicrotasks();

    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();
    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should not get image url when loading image fails in both requests',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      httpTestingController.expectOne(requestUrl1)
        .flush(imageBlob, {status: 404, statusText: 'Status Text'});
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4);
      expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
        .toEqual([filename2, filename3, filename4]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

      var onSuccess = jasmine.createSpy('success');
      var onFailure = jasmine.createSpy('fail');

      imagePreloaderService.getImageUrlAsync(filename1)
        .then(onSuccess, onFailure);

      httpTestingController.expectOne(requestUrl1)
        .flush(imageBlob, {status: 404, statusText: 'Status Text'});
      flushMicrotasks();

      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));

  it('should call the successful callback when loading an image after' +
    ' trying to get its image url', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

    imagePreloaderService.getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should call the failed callback when loading an image fails after' +
  ' trying to get its image url', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');

    imagePreloaderService.getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);

    httpTestingController.expectOne(requestUrl1)
      .flush(imageBlob, {status: 404, statusText: 'Status Text'});
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(imagePreloaderService.getFilenamesOfImageCurrentlyDownloading())
      .toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
  }));
});
