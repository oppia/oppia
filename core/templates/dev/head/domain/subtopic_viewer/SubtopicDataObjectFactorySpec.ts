// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SubtopicDataObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
import { TestBed } from '@angular/core/testing';

import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';

require('domain/subtopic_viewer/SubtopicDataObjectFactory.ts');

describe('Subtopic data object factory', function() {
  var SubtopicDataObjectFactory = null;
  var _sampleSubtopicData = null;
  let subtopicPageContentsObjectFactory: SubtopicPageContentsObjectFactory =
    null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  })); 

  beforeEach(angular.mock.inject(function($injector) {
    SubtopicDataObjectFactory = $injector.get('SubtopicDataObjectFactory');

    TestBed.configureTestingModule({
      providers: [SubtopicPageContentsObjectFactory]
    });

    subtopicPageContentsObjectFactory = TestBed.get(
      SubtopicPageContentsObjectFactory);

    var sampleSubtopicDataBackendDict = {
      subtopic_title: 'sample_title',
      page_contents: {
        subtitled_html: {
          html: 'test content',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'test.mp3',
                file_size_bytes: 100,
                needs_update: false
              }
            }
          }
        }
      }
    };
    _sampleSubtopicData = SubtopicDataObjectFactory.createFromBackendDict(
      sampleSubtopicDataBackendDict);
  }));

  it('should be able to get all the values', function() {
    expect(_sampleSubtopicData.getSubtopicTitle()).toEqual('sample_title');
    expect(_sampleSubtopicData.getPageContents()).toEqual(
      subtopicPageContentsObjectFactory.createFromBackendDict({
        subtitled_html: {
          html: 'test content',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'test.mp3',
                file_size_bytes: 100,
                needs_update: false
              }
            }
          }
        }
      })
    );
  });
});
