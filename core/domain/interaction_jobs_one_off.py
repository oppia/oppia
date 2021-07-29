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

"""One-off jobs for interaction validation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import exp_fetchers
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models

import python_utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])



class LogicProofInteractionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that produces a list of (exploaration, state) pairs that use the
    logicProof interaction. This will be used to send manual emails.
    This job can be deleted after logicProof is removed from the codebase.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        exploration = exp_fetchers.get_exploration_from_model(item)
        for state in exploration.states.values():
            if state.interaction.id == 'LogicProof':
                exploration_rights = rights_manager.get_exploration_rights(
                    item.id, strict=False)
                if exploration_rights is None:
                    yield ('MISSING_RIGHTS', item.id)
                    yield ('SUCCESS', 1)
                    return

                exp_owner_ids = exploration_rights.owner_ids
                if len(exp_owner_ids) == 0:
                    yield ('EMPTY', item.id)
                    yield ('SUCCESS', 1)
                    return
                for user_id in exp_owner_ids:
                    user_email = user_services.get_email_from_user_id(user_id)
                    if user_email:
                        yield ('EMAIL_DATA', (user_email, item.id))
                yield ('SUCCESS', 1)
                return
        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        if key == 'SUCCESS':
            yield (key, len(values))
        else:
            yield (key, values)
