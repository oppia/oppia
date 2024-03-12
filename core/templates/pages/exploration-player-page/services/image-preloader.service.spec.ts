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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  Exploration,
  ExplorationBackendDict,
  ExplorationObjectFactory,
} from 'domain/exploration/ExplorationObjectFactory';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {ContextService} from 'services/context.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';

describe('Image preloader service', () => {
  let httpTestingController: HttpTestingController;

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
  let entityTranslationsService: EntityTranslationsService;
  let svgSanitizerService: SvgSanitizerService;

  const initStateName = 'Introduction';
  const explorationDict: ExplorationBackendDict = {
    draft_changes: [],
    is_version_of_draft_valid: true,
    language_code: 'en',
    title: 'My Title',
    draft_change_list_id: 0,
    next_content_id_index: 5,
    init_state_name: initStateName,
    states: {
      'State 1': {
        param_changes: [],
        content: {
          html: '',
          content_id: 'content',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        interaction: {
          id: 'Continue',
          default_outcome: {
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            dest: 'State 3',
            dest_if_really_stuck: null,
            param_changes: [],
            labelled_as_correct: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            buttonText: {
              value: {
                unicode_str: 'Continue',
                content_id: '',
              },
            },
          },
          solution: null,
          answer_groups: [],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
      },
      'State 3': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: 'Congratulations, you have finished!',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
          },
        },
        interaction: {
          id: 'EndExploration',
          default_outcome: null,
          confirmed_unclassified_answers: [],
          customization_args: {
            recommendedExplorationIds: {
              value: [],
            },
          },
          solution: null,
          answer_groups: [],
          hints: [],
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
      },
      [initStateName]: {
        classifier_model_id: null,
        param_changes: [],
        content: {
          content_id: 'content',
          html: 'Multiple Choice',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {},
          },
        },
        interaction: {
          id: 'MultipleChoiceInput',
          default_outcome: {
            dest: initStateName,
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: 'Try Again!',
            },
            param_changes: [],
            labelled_as_correct: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            choices: {
              value: [
                {
                  html:
                    '<p> Go to ItemSelection <oppia-noninteractive-image' +
                    ' filepath-with-value="&amp;quot;' +
                    'sIMChoice1_height_32_width_42.png&amp;' +
                    'quot;"></oppia-noninteractive-image></p>',
                  content_id: '',
                },
                {
                  html:
                    '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                    ' filepath-with-value="&amp;quot;' +
                    'sIMChoice2_height_30_width_40.png&amp;' +
                    'quot;"></oppia-noninteractive-image></p>',
                  content_id: '',
                },
              ],
            },
            showChoicesInShuffledOrder: {value: false},
          },
          answer_groups: [
            {
              outcome: {
                dest: 'State 6',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html:
                    '<p>We are going to ItemSelection' +
                    '<oppia-noninteractive-image filepath-with-value=' +
                    '"&amp;quot;sIOFeedback_height_50_width_50.png' +
                    '&amp;quot;"></oppia-noninteractive-image></p>',
                },
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                labelled_as_correct: null,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 0},
                },
              ],
              training_data: null,
              tagged_skill_misconception_id: null,
            },
            {
              outcome: {
                dest: 'State 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: "Let's go to state 1 ImageAndRegion",
                },
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                labelled_as_correct: false,
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 1},
                },
              ],
              training_data: null,
              tagged_skill_misconception_id: null,
            },
          ],
          hints: [],
          solution: null,
        },
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
      },
      'State 6': {
        param_changes: [],
        content: {
          content_id: 'content',
          html: '<p>Text Input Content</p>',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {},
            hint_1: {},
          },
        },
        interaction: {
          id: 'TextInput',
          default_outcome: {
            dest: 'State 6',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: 1,
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: '',
              },
            },
            catchMisspellings: {
              value: false,
            },
          },
          answer_groups: [
            {
              rule_specs: [
                {
                  rule_type: 'Contains',
                  inputs: {
                    x: {
                      contentId: 'rule_input',
                      normalizedStrSet: ['1'],
                    },
                  },
                },
              ],
              outcome: {
                dest: 'State 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>",
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: null,
              tagged_skill_misconception_id: null,
            },
            {
              rule_specs: [
                {
                  rule_type: 'Contains',
                  inputs: {
                    x: {
                      contentId: 'rule_input',
                      normalizedStrSet: ['2'],
                    },
                  },
                },
              ],
              outcome: {
                dest: 'State 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 1</p>",
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
              },
              training_data: null,
              tagged_skill_misconception_id: null,
            },
          ],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html:
                  '<p><oppia-noninteractive-image filepath-with-value="' +
                  '&amp;quot;s6Hint1_height_60_width_60.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>',
              },
            },
          ],
          solution: null,
        },
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        classifier_model_id: null,
      },
    },
    param_specs: {},
    param_changes: [],
    exploration_metadata: {
      title: 'Exploration',
      category: 'Algebra',
      objective: 'To learn',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'Introduction',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
  } as unknown as ExplorationBackendDict;
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

  const requestUrl1 = `/assetsdevhandler/exploration/1/assets/image/${filename1}`;
  const requestUrl2 = `/assetsdevhandler/exploration/1/assets/image/${filename2}`;
  const requestUrl3 = `/assetsdevhandler/exploration/1/assets/image/${filename3}`;
  const requestUrl4 = `/assetsdevhandler/exploration/1/assets/image/${filename4}`;

  const imageBlob = new Blob(['image data'], {type: 'imagetype'});

  let exploration: Exploration;

  beforeEach(() => {
    imagePreloaderService = TestBed.get(ImagePreloaderService);
    explorationObjectFactory = TestBed.get(ExplorationObjectFactory);
    contextService = TestBed.get(ContextService);
    assetsBackendApiService = TestBed.get(AssetsBackendApiService);
    entityTranslationsService = TestBed.get(EntityTranslationsService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);

    spyOn(contextService, 'getExplorationId').and.returnValue('1');
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(entityTranslationsService, 'getHtmlTranslations').and.callFake(
      (unusedLanguageCode, unusedContentIds) => {
        return [];
      }
    );

    exploration =
      explorationObjectFactory.createFromBackendDict(explorationDict);
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

  it('should maintain the correct number of download requests in queue', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    // Max files to download simultaneously is 3.
    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();
    expect(imagePreloaderService.isLoadingImageFile(filename2)).toBeTrue();
    expect(imagePreloaderService.isLoadingImageFile(filename3)).toBeTrue();
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl2).flush(imageBlob);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl3).flush(imageBlob);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename3, filename4]);

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4).flush(imageBlob);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename4]);

    flushMicrotasks();

    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([]);
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
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);

    imagePreloaderService.restartImagePreloader('State 6');

    httpTestingController.expectOne(requestUrl4);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();
  });

  it(
    'should start preloader when state changes and there is at least' +
      ' one file downloading',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      httpTestingController.expectOne(requestUrl1);
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();

      imagePreloaderService.onStateChange('State 6');

      httpTestingController.expectOne(requestUrl4).flush(imageBlob);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename4]);
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

      flushMicrotasks();

      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();
    })
  );

  it(
    'should not start preloader when state changes and there is no' +
      ' file downloading',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      httpTestingController.expectOne(requestUrl2).flush(imageBlob);
      httpTestingController.expectOne(requestUrl3).flush(imageBlob);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4).flush(imageBlob);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename4]);

      imagePreloaderService.onStateChange('State 6');
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeTrue();

      flushMicrotasks();

      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([]);
      expect(imagePreloaderService.isLoadingImageFile(filename4)).toBeFalse();
    })
  );

  it(
    'should check that there is sync between AssetsBackendApi Service and' +
      'ImagePreloader Service',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);
      flushMicrotasks();

      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);
      expect(
        assetsBackendApiService
          .getAssetsFilesCurrentlyBeingRequested()
          .image.map(fileDownloadRequest => fileDownloadRequest.filename)
      ).toEqual([filename1, filename2, filename3]);

      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename2, filename3, filename4]);
      expect(
        assetsBackendApiService
          .getAssetsFilesCurrentlyBeingRequested()
          .image.map(fileDownloadRequest => fileDownloadRequest.filename)
      ).toEqual([filename2, filename3, filename4]);
    })
  );

  it('should maintain the filenames of image which failed to download', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2).flush(imageBlob);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);

    flushMicrotasks();

    httpTestingController
      .expectOne(requestUrl3)
      .flush(imageBlob, {status: 404, statusText: 'Status Text'});
    httpTestingController.expectOne(requestUrl4);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename3, filename4]);
    expect(imagePreloaderService.isInFailedDownload(filename3)).toBeFalse();

    flushMicrotasks();

    expect(imagePreloaderService.isInFailedDownload(filename3)).toBeTrue();
    expect(imagePreloaderService.isInFailedDownload(filename4)).toBeFalse();

    imagePreloaderService.restartImagePreloader('State 6');

    httpTestingController
      .expectOne(requestUrl4)
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
      'sIOFeedback_height_30_width_45_height_56_width_56.png'
    );
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
        'd231.svg'
    );
    expect(mathSvgDimensions.height).toEqual(2.456);
    expect(mathSvgDimensions.width).toEqual(6.124);
    expect(mathSvgDimensions.verticalPadding).toEqual(0.231);

    expect(() => {
      imagePreloaderService.getDimensionsOfMathSvg(
        'mathImg_20207261338r3ir43lmfd_2d456_width_6d124_vertical_0d231.svg'
      );
    }).toThrowError(/it does not contain dimensions/);
  });

  it('should fetch a non-SVG image', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController.expectOne(requestUrl1).flush(imageBlob);
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeFalse();

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');
    // This throws "Argument of type 'mockReaderObject' is not assignable
    // to parameter of type 'FileReader'.". We need to suppress this error
    // because 'FileReader' has around 15 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

    imagePreloaderService
      .getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it('should fetch an SVG image', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController
      .expectOne(requestUrl1)
      .flush(new Blob(['svg image'], {type: 'image/svg+xml'}));
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename2, filename3, filename4]);
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

    imagePreloaderService
      .getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);
    flushMicrotasks();

    expect(svgSanitizerService.getTrustedSvgResourceUrl).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  }));

  it(
    'should get image url when first loading fails and the second' +
      ' one is successful',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      httpTestingController
        .expectOne(requestUrl1)
        .flush(imageBlob, {status: 404, statusText: 'Status Text'});
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename2, filename3, filename4]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

      var onSuccess = jasmine.createSpy('success');
      var onFailure = jasmine.createSpy('fail');
      // This throws "Argument of type 'mockReaderObject' is not assignable
      // to parameter of type 'FileReader'.". We need to suppress this error
      // because 'FileReader' has around 15 more properties. We have only defined
      // the properties we need in 'mockReaderObject'.
      // @ts-expect-error
      spyOn(window, 'FileReader').and.returnValue(new mockReaderObject());

      imagePreloaderService
        .getImageUrlAsync(filename1)
        .then(onSuccess, onFailure);

      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      flushMicrotasks();

      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();
      expect(onSuccess).toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
    })
  );

  it('should not get image url when loading image fails in both requests', fakeAsync(() => {
    imagePreloaderService.init(exploration);
    imagePreloaderService.kickOffImagePreloader(initStateName);

    httpTestingController
      .expectOne(requestUrl1)
      .flush(imageBlob, {status: 404, statusText: 'Status Text'});
    httpTestingController.expectOne(requestUrl2);
    httpTestingController.expectOne(requestUrl3);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename1, filename2, filename3]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

    flushMicrotasks();

    httpTestingController.expectOne(requestUrl4);
    expect(
      imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
    ).toEqual([filename2, filename3, filename4]);
    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

    var onSuccess = jasmine.createSpy('success');
    var onFailure = jasmine.createSpy('fail');

    imagePreloaderService
      .getImageUrlAsync(filename1)
      .then(onSuccess, onFailure);

    httpTestingController
      .expectOne(requestUrl1)
      .flush(imageBlob, {status: 404, statusText: 'Status Text'});
    flushMicrotasks();

    expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
  }));

  it(
    'should call the successful callback when loading an image after' +
      ' trying to get its image url',
    fakeAsync(() => {
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

      imagePreloaderService
        .getImageUrlAsync(filename1)
        .then(onSuccess, onFailure);

      httpTestingController.expectOne(requestUrl1).flush(imageBlob);
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isLoadingImageFile(filename1)).toBeTrue();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename2, filename3, filename4]);

      expect(onSuccess).toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
    })
  );

  it(
    'should call the failed callback when loading an image fails after' +
      ' trying to get its image url',
    fakeAsync(() => {
      imagePreloaderService.init(exploration);
      imagePreloaderService.kickOffImagePreloader(initStateName);

      var onSuccess = jasmine.createSpy('success');
      var onFailure = jasmine.createSpy('fail');

      imagePreloaderService
        .getImageUrlAsync(filename1)
        .then(onSuccess, onFailure);

      httpTestingController
        .expectOne(requestUrl1)
        .flush(imageBlob, {status: 404, statusText: 'Status Text'});
      httpTestingController.expectOne(requestUrl2);
      httpTestingController.expectOne(requestUrl3);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename1, filename2, filename3]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeFalse();

      flushMicrotasks();

      httpTestingController.expectOne(requestUrl4);
      expect(
        imagePreloaderService.getFilenamesOfImageCurrentlyDownloading()
      ).toEqual([filename2, filename3, filename4]);
      expect(imagePreloaderService.isInFailedDownload(filename1)).toBeTrue();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    })
  );
});
