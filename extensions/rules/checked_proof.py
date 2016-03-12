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

"""Rules for CheckedProof objects."""

from extensions.rules import base


class Correct(base.CheckedProofRule):
    description = 'is correct'


class NotCorrect(base.CheckedProofRule):
    description = 'is not correct'


class NotCorrectByCategory(base.CheckedProofRule):
    description = 'is not correct due to {{c|LogicErrorCategory}}'
