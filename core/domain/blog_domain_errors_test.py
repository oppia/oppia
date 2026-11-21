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
"""Tests for blog domain error classes."""

from __future__ import annotations

from core import utils
from core.domain import blog_domain_errors
from core.tests import test_utils


class BlogDomainErrorsTests(test_utils.GenericTestBase):
    """Tests blog domain error inheritance."""

    def test_blog_domain_errors_are_validation_errors(self) -> None:
        for error_class in (
            blog_domain_errors.InvalidBlogPostIdError,
            blog_domain_errors.InvalidEditorIdError,
            blog_domain_errors.DuplicateEditorIdError,
            blog_domain_errors.InvalidPublishedStatusError,
        ):
            self.assertTrue(issubclass(error_class, utils.ValidationError))
