// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Unit tests for ConceptCardObjectFactory.
*/

describe('Concept card object factory', function() {
  beforeEach(module('oppia'));

  describe('ConceptCardObjectFactory', function() {
    var ConceptCardObjectFactory;
    var conceptCardDict;

    beforeEach(inject(function($injector) {
      ConceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');
      SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');

      conceptCardDict = {
        explanation: SubtitledHtmlObjectFactory.createDefault(
          'test explanation', 'explanation'),
        worked_examples: [
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 1', 'worked_example_1'),
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 2', 'worked_example_2')
        ]
      };

      conceptCardDict = {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [
          {
            html: 'worked example 1',
            content_id: 'worked_example_1'
          },
          {
            html: 'worked example 2',
            content_id: 'worked_example_2'
          }
        ],
        content_ids_to_audio_translations: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      };
    }));

    it('should create a new concept card from a backend dictionary',
      function() {
        var conceptCard =
          ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
        expect(conceptCard.getExplanation()).toEqual(
          SubtitledHtmlObjectFactory.createDefault(
            'test explanation', 'explanation'));
        expect(conceptCard.getWorkedExamples()).toEqual(
          [SubtitledHtmlObjectFactory.createDefault(
            'worked example 1', 'worked_example_1'),
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 2', 'worked_example_2')]);
      });

    it('should convert to a backend dictionary', function() {
      var conceptCard =
        ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
      expect(conceptCard.toBackendDict()).toEqual(conceptCardDict);
    });

    it('should create an interstitial concept card', function() {
      var conceptCard =
        ConceptCardObjectFactory.createInterstitialConceptCard();
      expect(conceptCard.getExplanation()).toEqual(
        SubtitledHtmlObjectFactory.createDefault(
          'Loading review material', 'explanation'));
      expect(conceptCard.getWorkedExamples()).toEqual([]);
    });
  });
});
