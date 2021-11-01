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
python_linter_test. This file does not contain unicode literal future import.
"""


class FakeClass:
    """This is a fake docstring for invalid syntax purposes."""

    def __init__(self, fake_arg):
        self.fake_arg = fake_arg

    def fake_method(self, name):
        """This doesn't do anything.

        Args:
            name: str. Means nothing.

        Yields:
            tuple(str, str). The argument passed in but twice in a tuple.
        """
        yield (name, name)
