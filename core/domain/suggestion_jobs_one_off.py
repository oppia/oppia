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

"""One-off jobs for suggestions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import suggestion_services
from core.platform import models
import feconf

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


class QuestionSuggestionMigrationJobManager(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that can be used to migrate state schema
    versions of question suggestions.

    This job will create domain objects out of the models. The object conversion
    process of a suggestion automatically performs schema updating. This
    job persists that conversion work, keeping question suggestions up-to-date
    and improving the load time of question suggestions.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        if item.deleted or item.suggestion_type != (
                feconf.SUGGESTION_TYPE_ADD_QUESTION):
            return

        try:
            # Suggestion class itself updates the question state dict of the
            # suggestion while initializing the object.
            suggestion = suggestion_services.get_suggestion_from_model(item)
        except Exception as e:
            yield ('MIGRATION_FAILURE', (item.id, e))
            return

        try:
            suggestion.validate()
        except Exception as e:
            yield ('POST_MIGRATION_VALIDATION_FALIURE', (item.id, e))
            return

        item.change_cmd = suggestion.change.to_dict()
        item.update_timestamps(update_last_updated_time=False)
        item.put()

        yield ('SUCCESS', item.id)

    @staticmethod
    def reduce(key, value):
        if key == 'SUCCESS':
            value = len(value)
        yield (key, value)
