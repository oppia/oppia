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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Jeremy Emerson'

from apps.widget.models import InteractiveWidget
from apps.widget.models import NonInteractiveWidget
from apps.widget.models import Widget
import test_utils


class WidgetUnitTests(test_utils.AppEngineTestBase):
    """Test widget models."""

    def test_loading_and_deletion_of_widgets(self):
        """Test loading and deletion of the default widgets."""
        self.assertEqual(Widget.query().count(), 0)

        InteractiveWidget.load_default_widgets()
        self.assertEqual(Widget.query().count(), 7)
        self.assertEqual(InteractiveWidget.query().count(), 7)
        self.assertEqual(NonInteractiveWidget.query().count(), 0)

        Widget.delete_all_widgets()
        self.assertEqual(Widget.query().count(), 0)
