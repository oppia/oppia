# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Python file with invalid syntax, used by scripts/linters/
python_linter_test. This file is using urlencode which is not allowed.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import urllib

import python_utils


class FakeClass(python_utils.OBJECT):
    """This is a fake docstring for invalid syntax purposes."""

    def __init__(self, fake_arg):
        self.fake_arg = fake_arg

    def fake_method(self, source_url, doseq):
        """This doesn't do anything.

        Args:
            source_url: str. The URL.
            doseq: bool. Boolean value.

        Returns:
            urlencode(object): Returns urlencode object.
        """
        # Use of urlencode is not allowed.
        return urllib.urlencode(source_url, doseq=doseq)
