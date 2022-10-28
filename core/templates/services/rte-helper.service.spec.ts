// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for RteHelperService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// RteHelperService.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Rte Helper Service', function() {
  var RteHelperService = null;
  var $q = null;
  var $uibModal = null;
  var $log = null;
  var $rootScope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    RteHelperService = $injector.get('RteHelperService');
    $q = $injector.get('$q');
    $uibModal = $injector.get('$uibModal');
    $log = $injector.get('$log');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should get rich text components', function() {
    expect(RteHelperService.getRichTextComponents()).toEqual([{
      backendId: 'Collapsible',
      customizationArgSpecs: [{
        name: 'heading',
        description: 'The heading for the collapsible block',
        schema: {
          type: 'unicode'
        },
        default_value: 'Sample Header'
      }, {
        name: 'content',
        description: 'The content of the collapsible block',
        schema: {
          type: 'html',
          ui_config: {
            hide_complex_extensions: true
          }
        },
        default_value: 'You have opened the collapsible block.'
      }],
      id: 'collapsible',
      iconDataUrl: '/rich_text_components/Collapsible/Collapsible.png',
      isComplex: true,
      isBlockElement: true,
      requiresFs: false,
      tooltip: 'Insert collapsible block',
      requiresInternet: false
    }, {
      backendId: 'Image',
      customizationArgSpecs: [{
        name: 'filepath',
        description: 'The image (Allowed extensions: gif, jpeg, jpg, png, svg)',
        schema: {
          type: 'custom',
          obj_type: 'Filepath'
        },
        default_value: ''
      }, {
        name: 'caption',
        description: 'Caption for image (optional)',
        schema: {
          type: 'unicode',
          validators: [{
            id: 'has_length_at_most',
            max_value: 500
          }]
        },
        default_value: ''
      }, {
        name: 'alt',
        description: 'Briefly explain this image to a visually impaired' +
        ' learner',
        schema: {
          type: 'unicode',
          validators: [{
            id: 'has_length_at_least',
            min_value: 5
          }],
          ui_config: {
            placeholder: 'Description of Image (Example : George Handel,' +
            ' 18th century baroque composer)',
            rows: 3
          }
        },
        default_value: ''
      }],
      id: 'image',
      iconDataUrl: '/rich_text_components/Image/Image.png',
      isComplex: false,
      isBlockElement: true,
      requiresFs: true,
      tooltip: 'Insert image',
      requiresInternet: true
    }, {
      backendId: 'Link',
      customizationArgSpecs: [{
        name: 'url',
        description: 'The link URL. If no protocol is specified, HTTPS will' +
        ' be used.',
        schema: {
          type: 'custom',
          obj_type: 'SanitizedUrl'
        },
        default_value: ''
      }, {
        name: 'text',
        description: 'The link text. If left blank, the link URL will be used.',
        schema: {
          type: 'unicode'
        },
        default_value: ''
      }],
      id: 'link',
      iconDataUrl: '/rich_text_components/Link/Link.png',
      isComplex: false,
      isBlockElement: false,
      requiresFs: false,
      tooltip: 'Insert link',
      requiresInternet: false
    }, {
      backendId: 'Math',
      customizationArgSpecs: [{
        name: 'math_content',
        description: 'The Math Expression to be displayed.',
        schema: {
          type: 'custom',
          obj_type: 'MathExpressionContent'
        },
        default_value: {
          raw_latex: '',
          svg_filename: ''
        }
      }],
      id: 'math',
      iconDataUrl: '/rich_text_components/Math/Math.png',
      isComplex: false,
      isBlockElement: false,
      requiresFs: false,
      tooltip: 'Insert mathematical formula',
      requiresInternet: true
    }, {
      backendId: 'skillreview',
      customizationArgSpecs: [{
        name: 'text',
        description: 'The text to be displayed',
        schema: {
          type: 'unicode',
          validators: [{
            id: 'is_nonempty'
          }]
        },
        default_value: 'concept card'
      }, {
        name: 'skill_id',
        description: 'The skill that this link refers to',
        schema: {
          type: 'custom',
          obj_type: 'SkillSelector'
        },
        default_value: ''
      }],
      id: 'skillreview',
      iconDataUrl: '/rich_text_components/Skillreview/Skillreview.png',
      isComplex: false,
      isBlockElement: false,
      requiresFs: false,
      tooltip: 'Insert Concept Card Link',
      requiresInternet: true
    }, {
      backendId: 'Tabs',
      customizationArgSpecs: [{
        name: 'tab_contents',
        description: 'The tab titles and contents.',
        schema: {
          type: 'custom',
          obj_type: 'ListOfTabs'
        },
        default_value: [{
          title: 'Hint introduction',
          content: 'This set of tabs shows some hints. Click on the other' +
          ' tabs to display the relevant hints.'
        },
        {
          title: 'Hint 1',
          content: 'This is a first hint.'
        }]
      }],
      id: 'tabs',
      iconDataUrl: '/rich_text_components/Tabs/Tabs.png',
      isComplex: true,
      isBlockElement: true,
      requiresFs: false,
      tooltip: 'Insert tabs (e.g. for hints)',
      requiresInternet: false
    }, {
      backendId: 'Video',
      customizationArgSpecs: [{
        name: 'video_id',
        description: 'The Youtube URL or the YouTube id for this video.' +
        ' (The Youtube id is the 11-character string after \"v=\" in' +
        ' the video URL.)',
        schema: {
          type: 'unicode'
        },
        default_value: ''
      }, {
        name: 'start',
        description: 'Video start time in seconds: (leave at 0 to start' +
        ' at the beginning.)',
        schema: {
          type: 'int',
          validators: [{
            id: 'is_at_least',
            min_value: 0
          }]
        },
        default_value: 0
      }, {
        name: 'end',
        description: 'Video end time in seconds: (leave at 0 to play until' +
        ' the end.)',
        schema: {
          type: 'int',
          validators: [{
            id: 'is_at_least',
            min_value: 0
          }]
        },
        default_value: 0
      }, {
        name: 'autoplay',
        description: 'Autoplay this video once the question has loaded?',
        schema: {
          type: 'bool'
        },
        default_value: false
      }],
      id: 'video',
      iconDataUrl: '/rich_text_components/Video/Video.png',
      isComplex: false,
      isBlockElement: true,
      requiresFs: false,
      tooltip: 'Insert video',
      requiresInternet: true
    }]);
  });

  it('should evalute when rich text component is inline', function() {
    expect(RteHelperService.isInlineComponent('link')).toBe(true);
    expect(RteHelperService.isInlineComponent('math')).toBe(true);
    expect(RteHelperService.isInlineComponent('skillreview')).toBe(true);
  });

  it('should evalute when rich text component is not inline', function() {
    expect(RteHelperService.isInlineComponent('video')).toBe(false);
    expect(RteHelperService.isInlineComponent('tabs')).toBe(false);
    expect(RteHelperService.isInlineComponent('image')).toBe(false);
  });

  it('should create customization arg dict from attributes', function() {
    var logSpy = spyOn($log, 'error').and.callThrough();
    var attrs = [{
      name: 'class'
    }, {
      name: 'src'
    }, {
      name: '_moz_resizing'
    }, {
      name: 'attribute-with-value',
      value: '"attribute value"'
    }, {
      name: 'invalid'
    }];

    expect(RteHelperService.createCustomizationArgDictFromAttrs(attrs))
      .toEqual({
        attribute: 'attribute value'
      });

    expect(logSpy).toHaveBeenCalledWith(
      'RTE Error: invalid customization attribute invalid');
  });

  it('should open customization modal', function() {
    var uibModalSpy = spyOn($uibModal, 'open').and.callThrough();
    var submitCallBackSpy = jasmine.createSpy('submit');
    var dismissCallBackSpy = jasmine.createSpy('dismiss');
    RteHelperService.openCustomizationModal(
      {}, {}, submitCallBackSpy, dismissCallBackSpy, function() {});

    expect(uibModalSpy).toHaveBeenCalled();
  });

  it('should open customization modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    var submitCallBackSpy = jasmine.createSpy('submit');
    var dismissCallBackSpy = jasmine.createSpy('dismiss');
    RteHelperService.openCustomizationModal(
      {}, {}, submitCallBackSpy, dismissCallBackSpy, function() {});
    $rootScope.$apply();

    expect(submitCallBackSpy).toHaveBeenCalled();
  });

  it('should open customization modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    var submitCallBackSpy = jasmine.createSpy('submit');
    var dismissCallBackSpy = jasmine.createSpy('dismiss');
    RteHelperService.openCustomizationModal(
      {}, {}, submitCallBackSpy, dismissCallBackSpy, function() {});
    $rootScope.$apply();

    expect(dismissCallBackSpy).toHaveBeenCalled();
  });
});
