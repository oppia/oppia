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

export class TopicLandingPageConstants {
  public static TOPIC_LANDING_PAGE_DATA = {
    math: {
      fractions: {
        topicTitle: 'Fractions',
        topicTagline: 'Add, Subtract, Multiply and Divide',
        collectionId: '4UgTQUc1tala'
      },
      'negative-numbers': {
        topicTitle: 'Negative Numbers',
        topicTagline: 'Add, Subtract, Multiply and Divide',
        collectionId: 'GdYIgsfRZwG7'
      },
      ratios: {
        topicTitle: 'Ratios',
        topicTagline: 'Equivalent Ratios, Combining Ratios',
        collectionId: '53gXGLIR044l'
      }
    }
  };

  public static LESSON_QUALITIES_DATA = [{
    title: 'Fun storytelling',
    description: (
      'Oppia\'s lessons tell stories using video and images to ' +
      'help learners apply math concepts in everyday life.'),
    imageFilename: 'fun_storytelling.png',
    imageAlt: 'An image of a lesson journey illustrated on top of an open book.'
  }, {
    title: 'Accessible lessons',
    description: (
      'Our lessons come with audio translations in different ' +
      'languages, require little bandwidth, and are mobile friendly.'),
    imageFilename: 'accessible_lessons.png',
    imageAlt: 'A speaker emitting sound next to text and a Play button.'
  }, {
    title: 'Suitable for all',
    description: (
      'No matter your level, there\'s a lesson for you! From ' +
      'learning the meaning of equal parts, to comparing fractions ' +
      '- Oppia has you covered.'),
    imageFilename: 'suitable_for_all.png',
    imageAlt: 'A selection of characters from the lessons.'
  }];
}
