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

"""Rules for Numbers and Reals."""

__author__ = 'Sean Lip'

from data.objects.models import objects
from data.rules import base


class Equals(base.NumberRule):
    description = 'is equal to {{x|Number}}'
    _PARAMS = [('x', objects.Number)]

    def _evaluate(self, subject):
        return subject == self.x
