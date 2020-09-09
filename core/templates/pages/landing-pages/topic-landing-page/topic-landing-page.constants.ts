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
 * @fileoverview Constants for landing page.
 */

// Note: This oppia constant needs to be keep in sync with
// AVAILABLE_LANDING_PAGES constant defined in feconf.py file.

export const TopicLandingPageConstants = {
  TOPIC_LANDING_PAGE_DATA: {
    math: {
      fractions: {
        topicTitle: 'Fractions',
        topicTagline: 'Add, Subtract, Multiply and Divide',
        collectionId: '4UgTQUc1tala',
        chapters: ['The meaning of equal parts', 'Comparing fractions']
      },
      'negative-numbers': {
        topicTitle: 'Negative Numbers',
        topicTagline: 'Add, Subtract, Multiply and Divide',
        collectionId: 'GdYIgsfRZwG7',
        chapters: [
          'The meaning of the number line', 'Calculating with negative numbers']
      },
      ratios: {
        topicTitle: 'Ratios',
        topicTagline: 'Equivalent Ratios, Combining Ratios',
        collectionId: '53gXGLIR044l',
        chapters: ['The meaning of equivalent ratios', 'Combining Ratios']
      }
    }
  }
} as const;
