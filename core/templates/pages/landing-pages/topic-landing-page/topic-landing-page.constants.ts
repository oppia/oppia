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
        topic_title: 'Fractions',
        topic_tagline: 'Add, Subtract, Multiply and Divide',
        collection_id: '4UgTQUc1tala',
        page_data: {
          image_1: {
            file_name: 'matthew_paper',
            alt: 'Matthew showing parts of fractions written on a card.'
          },
          image_2: {
            file_name: 'matthew_fractions',
            alt: 'Matthew solving problems on Oppia.'
          },
          video: 'fractions_video.mp4',
          lessons: [
            'What is a Fraction?',
            'Comparing Fractions',
            'The Meaning of "Equal Parts"',
            'Adding & Subtracting Fractions'
          ]
        }
      },
      'negative-numbers': {
        topic_title: 'Negative Numbers',
        topic_tagline: '',
        collection_id: 'GdYIgsfRZwG7',
        page_data: {
          image_1: {
            file_name: 'negative_1',
            alt: 'A boy showing 3 + -24 written on a slate.'
          },
          image_2: {
            file_name: 'negative_2',
            alt: 'A boy smiling and solving negative-number problems on Oppia.'
          },
          video: 'negative-numbers_video.mp4',
          lessons: [
            'The Number Line',
            'What is a Negative Number?',
            'Adding & Subtracting Negative Numbers',
            'Multiplying & Dividing Negative Numbers'
          ]
        }
      },
      ratios: {
        topic_title: 'Ratios',
        topic_tagline: '',
        collection_id: '53gXGLIR044l',
        page_data: {
          image_1: {
            file_name: 'ratios_James',
            alt: 'A boy showing 2 is to 3 ratio on a card.'
          },
          image_2: {
            file_name: 'ratios_question',
            alt: 'A smoothie shop and a card having question "What does a' +
              ' ratio tell us?" with options.'
          },
          video: 'ratios_video.mp4',
          lessons: [
            'What is a Ratio?',
            'Equivalent Ratios',
            'Ratios & Proportional Reasoning',
            'Writing Ratios in Simplest Form'
          ]
        }
      }
    }
  };
}
