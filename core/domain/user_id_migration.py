# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Jobs for queries personalized to individual users."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.platform import models

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class UserIdMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating new user ids for all the users and re-adding
    models that use the user id.
    """

    @staticmethod
    def _copy_model_with_new_id(model_class, old_user_id, new_user_id):
        """Create new model with same values but new id."""
        old_model = model_class.get_by_id(old_user_id)
        if not old_model:
            return
        model_values = old_model.to_dict()
        model_values['id'] = new_user_id
        model_class(**model_values).put(update_last_updated_time=False)
        old_model.delete()

    @staticmethod
    def _copy_model_with_new_id_and_user_id(
            model_class, old_user_id, new_user_id):
        """Create new model with same values but new id and user_id."""
        old_models = model_class.query(
            model_class.get_user_id_migration_field() == old_user_id).fetch()
        for old_model in old_models:
            model_values = old_model.to_dict()
            new_id = '%s.%s' % (new_user_id, old_model.id.split('.')[1])
            model_values['id'] = new_id
            model_values['user_id'] = new_user_id
            model_class(**model_values).put(update_last_updated_time=False)
            old_model.delete()

    @staticmethod
    def _change_model_with_one_user_id_field(
            model_class, old_user_id, new_user_id):
        """Replace field in model with new user id."""
        migration_field = model_class.get_user_id_migration_field()
        found_models = model_class.query(
            migration_field == old_user_id).fetch()
        for model in found_models:
            model_values = model.to_dict()
            model_values[migration_field._name] = new_user_id  # pylint: disable=protected-access
            model.populate(**model_values)
            model.put(update_last_updated_time=False)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        old_user_id = user_model.id
        new_user_id = user_models.UserSettingsModel.get_new_id('user')
        for model_class in models.Registry.get_all_storage_model_classes():
            if (model_class.get_user_id_migration_policy() ==
                    base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE):
                continue
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY):
                UserIdMigrationJob._copy_model_with_new_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.COPY_PART):
                UserIdMigrationJob._copy_model_with_new_id_and_user_id(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD):
                UserIdMigrationJob._change_model_with_one_user_id_field(
                    model_class, old_user_id, new_user_id)
            elif (model_class.get_user_id_migration_policy() ==
                  base_models.USER_ID_MIGRATION_POLICY.CUSTOM):
                model_class.migrate_model(old_user_id, new_user_id)
        yield ('SUCCESS', new_user_id)

    @staticmethod
    def reduce(key, new_user_ids):
        """Implements the reduce function for this job."""
        yield (key, new_user_ids)
