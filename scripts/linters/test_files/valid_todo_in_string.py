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

"""Python file with valid TODO in string literals, used by scripts/linters/
general_purpose_linter_test.py.
"""

from __future__ import annotations


class FakeClass:
    """This is a fake class for testing valid TODO in strings."""

    def __init__(self, fake_arg: str) -> None:
        self.fake_arg = fake_arg

    def fake_method(self) -> str:
        """This returns a string with TODO.

        Returns:
            str. A string containing TODO.
        """
        single_quote_todo_str = 'TODO #123'
        double_quote_todo_str = "TODO fix later"
        return single_quote_todo_str + double_quote_todo_str
