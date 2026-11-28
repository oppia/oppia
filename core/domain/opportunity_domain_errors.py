# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Error classes for opportunity domain objects."""

from __future__ import annotations

from core import utils


class InvalidSkillIdError(utils.ValidationError):
    """Raised when a skill ID in SkillOpportunity is invalid."""

    pass


class InvalidSkillDescriptionError(utils.ValidationError):
    """Raised when a skill description in SkillOpportunity is invalid."""

    pass


class InvalidQuestionCountError(utils.ValidationError):
    """Raised when a question count in SkillOpportunity is invalid."""

    pass
