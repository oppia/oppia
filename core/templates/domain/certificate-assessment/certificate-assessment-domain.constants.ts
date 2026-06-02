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
 * @fileoverview Constants for certificate assessment backend APIs.
 */

export const CertificateAssessmentDomainConstants = {
  CERTIFICATE_ASSESSMENT_OFFERING_HANDLER_URL:
    '/certificate_assessment_offering_handler',
  CERTIFICATE_ASSESSMENT_OFFERING_BY_ID_HANDLER_URL:
    '/certificate_assessment_offering_handler/<certificate_id>',
} as const;
