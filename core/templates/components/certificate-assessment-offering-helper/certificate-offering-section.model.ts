// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Section IDs for certificate offering create and edit flows.
 */

export const CERTIFICATE_OFFERING_SECTION_IDS = {
  DETAILS: 'details',
  ADD_TOPIC_ITEMS: 'add_topic_items',
  REVIEW_AND_AVAILABILITY: 'review_and_availability',
} as const;

export const CERTIFICATE_OFFERING_SECTION_TITLES = [
  'Add Certificate Details',
  'Add Certificate Topics',
  'Review & Availability',
] as const;

export const CERTIFICATE_OFFERING_SECTION_NUMBERS = {
  DETAILS: 1,
  ADD_TOPIC_ITEMS: 2,
  REVIEW_AND_AVAILABILITY: 3,
} as const;

export const CERTIFICATE_OFFERING_PROGRESS_TAB_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
} as const;

export const CERTIFICATE_OFFERING_PROGRESS_TAB_STATE_LABELS = {
  CURRENT: 'current',
} as const;

export type CertificateOfferingSectionId =
  (typeof CERTIFICATE_OFFERING_SECTION_IDS)[keyof typeof CERTIFICATE_OFFERING_SECTION_IDS];
