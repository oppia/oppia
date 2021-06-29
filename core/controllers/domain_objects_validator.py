# coding: utf-8

# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Methods for validating domain objects for schema validation of
handler arguments.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain

from typing import Any, Dict # isort:skip  pylint: disable=wrong-import-order, wrong-import-position, unused-import, import-only-modules


def validate_exploration_change(obj):
    # type: (Dict[Any, Any]) -> None
    """Validates exploration change.

    Args:
        obj: dict. Data that needs to be validated.
    """
    # No explicit call to validate_dict method is necessary, because
    # ExplorationChange calls it while initialization.
    exp_domain.ExplorationChange(obj) # type: ignore[no-untyped-call]
