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
 * @fileoverview Unit test for the Translation status service.
 */

 describe('Translation status service', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('TranslationLanguageService', {
      audioTranslation: {"filename":"content-en-1hnku9cy13.mp3", fileSizeBytes: 56842,"needsUpdate":true},
      getActiveLanguageCode: function() {
        return ['en'];
      },
      availableTranslationLanguageCodes: ["en"],
      allContentId: ["content", "default_outcome", "feedback_1"] 
    });
    $provide.value('StateContentIdsToAudioTranslationsService', {
      displayed: {
        getAllContentId: function() {
          return ['content', 'default_outcome', 'feedback_1'];
        }
      }
    });
    $provide.value('ExplorationStatesService', {
      isInitialized: function() {
      return true;
      },
      getStateNames: function() {
        return ['First'];
      },
      getContentIdsToAudioTranslationsMemento: function(stateName) {
        if(stateName === 'First') {
          return {"_contentIdsToAudioTranslations":{"feedback_1":{},"default_outcome":{},"content":{"en":{"filename":"content-en-1hnku9cy13.mp3", fileSizeBytes: 56842,"needsUpdate":true}}}};
        }
      },
      getInteractionIdMemento: function(stateName) {
        if(stateName === "First") {
          return "MultipleChoiceInput";
        }
      }
    });
  }));

  describe('Translation status service', function() {
    var tss = null;
    beforeEach(inject(function($injector) {
      tss = $injector.get('TranslationStatusService');
    }));

    it('should get all state names that need update in Audio Translations', function() {
      var allStatesNeedingUpdate = tss.getAllStatesNeedUpdatewarning();
      console.log(JSON.stringify(allStatesNeedingUpdate));
      expect(allStatesNeedingUpdate['First']).toBe('Audio needs update!');
      expect(allStatesNeedingUpdate['end']).toBe(undefined);
    });
  });
});

