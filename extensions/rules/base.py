# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Base rules."""

from core.domain import rule_domain
from extensions.objects.models import objects


class CodeEvaluationRule(rule_domain.Rule):
    subject_type = objects.CodeEvaluation


class CoordTwoDimRule(rule_domain.Rule):
    subject_type = objects.CoordTwoDim


class MusicPhraseRule(rule_domain.Rule):
    subject_type = objects.MusicPhrase


class NonnegativeIntRule(rule_domain.Rule):
    subject_type = objects.NonnegativeInt


class NormalizedStringRule(rule_domain.Rule):
    subject_type = objects.NormalizedString


class RealRule(rule_domain.Rule):
    subject_type = objects.Real


class SetOfUnicodeStringRule(rule_domain.Rule):
    subject_type = objects.SetOfUnicodeString


class SetOfHtmlStringRule(rule_domain.Rule):
    subject_type = objects.SetOfHtmlString


class UnicodeStringRule(rule_domain.Rule):
    subject_type = objects.UnicodeString


class CheckedProofRule(rule_domain.Rule):
    subject_type = objects.CheckedProof


class GraphRule(rule_domain.Rule):
    subject_type = objects.Graph


class ImageWithRegionsRule(rule_domain.Rule):
    subject_type = objects.ImageWithRegions


class ClickOnImageRule(rule_domain.Rule):
    subject_type = objects.ClickOnImage
