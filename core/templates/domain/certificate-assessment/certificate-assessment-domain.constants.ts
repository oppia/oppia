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
 * @fileoverview Constants for certificate assessment backend APIs and shared
 * certificate offering flows.
 */

export const CertificateAssessmentDomainConstants = {
  CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL:
    '/certificate_assessment_offering_handler',
  CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL:
    '/certificate_assessment_offering_handler/<certificate_id>',
} as const;

// Confirmation actions are used by the pre-save modal to represent the user's
// choice before the certificate is created or updated.
export const CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
} as const;

export type CertificateOfferingConfirmationAction =
  (typeof CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS)[keyof typeof CERTIFICATE_OFFERING_CONFIRMATION_ACTIONS];

// Result actions are used by the post-save modal to describe what happened
// after the certificate was created or updated.
export const CERTIFICATE_OFFERING_RESULT_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
} as const;

export type CertificateOfferingResultAction =
  (typeof CERTIFICATE_OFFERING_RESULT_ACTIONS)[keyof typeof CERTIFICATE_OFFERING_RESULT_ACTIONS];

// Save statuses are used when the user chooses to leave the certificate as not
// ready while still persisting the draft.
export const CERTIFICATE_OFFERING_SAVE_STATUSES = {
  NOT_READY: 'not_ready',
} as const;

export type CertificateOfferingSaveStatus =
  (typeof CERTIFICATE_OFFERING_SAVE_STATUSES)[keyof typeof CERTIFICATE_OFFERING_SAVE_STATUSES];
