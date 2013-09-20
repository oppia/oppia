# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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


class Coord2DRule(rule_domain.Rule):
    subject_type = objects.Coord2D


class ListRule(rule_domain.Rule):
    subject_type = objects.List


class MusicNoteRule(rule_domain.Rule):
    subject_type = objects.MusicNote


class NonnegativeIntRule(rule_domain.Rule):
    subject_type = objects.NonnegativeInt


class NormalizedStringRule(rule_domain.Rule):
    subject_type = objects.NormalizedString


class NumberRule(rule_domain.Rule):
    subject_type = objects.Number


class RealRule(rule_domain.Rule):
    subject_type = objects.Real


class SetRule(rule_domain.Rule):
    subject_type = objects.Set


class UnicodeStringRule(rule_domain.Rule):
    subject_type = objects.UnicodeString


class TarFileStringRule(rule_domain.Rule):
    subject_type = objects.TarFileString
