# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for explorations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core import jobs
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.platform import models
import feconf
import python_utils

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class ExplorationMigrationJobManager(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all existing explorations from the data store
    and immediately store them back into the data store. The loading process of
    an exploration in exp_services automatically performs schema updating. This
    job persists that conversion work, keeping explorations up-to-date and
    improving the load time of new explorations.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExplorationMigrationJobManager, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        if item.deleted:
            return

        # Do not upgrade explorations that fail non-strict validation.
        old_exploration = exp_fetchers.get_exploration_by_id(item.id)
        try:
            old_exploration.validate()
        except Exception as e:
            logging.error(
                'Exploration %s failed non-strict validation: %s' %
                (item.id, e))
            return

        # If the exploration model being stored in the datastore is not the
        # most up-to-date states schema version, then update it.
        if item.states_schema_version != feconf.CURRENT_STATE_SCHEMA_VERSION:
            # Note: update_exploration does not need to apply a change list in
            # order to perform a migration. See the related comment in
            # exp_services.apply_change_list for more information.
            #
            # Note: from_version and to_version really should be int, but left
            # as str to conform with legacy data.
            commit_cmds = [exp_domain.ExplorationChange({
                'cmd': exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION,
                'from_version': python_utils.UNICODE(
                    item.states_schema_version),
                'to_version': python_utils.UNICODE(
                    feconf.CURRENT_STATE_SCHEMA_VERSION)
            })]
            exp_services.update_exploration(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update exploration states from schema version %d to %d.' % (
                    item.states_schema_version,
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield ('SUCCESS', item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class ExpSnapshotsMigrationJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate exploration schema
    versions. This job will load all snapshots of all existing explorations
    from the datastore and immediately store them back into the datastore.
    The loading process of an exploration in exp_services automatically
    performs schema updating. This job persists that conversion work, keeping
    explorations up-to-date and improving the load time of new explorations.

    NOTE TO DEVELOPERS: Make sure to run ExpSnapshotsMigrationAuditJob before
    running this job.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotContentModel]

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(ExpSnapshotsMigrationJob, cls).enqueue(
            job_id, shard_count=64)

    @staticmethod
    def map(item):
        exp_id = item.get_unversioned_instance_id()

        latest_exploration = exp_fetchers.get_exploration_by_id(
            exp_id, strict=False)
        if latest_exploration is None:
            yield ('INFO - Exploration does not exist', item.id)
            return

        exploration_model = exp_models.ExplorationModel.get(exp_id)
        if (exploration_model.states_schema_version !=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            yield (
                'FAILURE - Exploration is not at latest schema version', exp_id)
            return

        try:
            latest_exploration.validate()
        except Exception as e:
            yield (
                'INFO - Exploration %s failed non-strict validation' % item.id,
                e)

        # If the snapshot being stored in the datastore does not have the most
        # up-to-date states schema version, then update it.
        target_state_schema_version = feconf.CURRENT_STATE_SCHEMA_VERSION
        current_state_schema_version = item.content['states_schema_version']
        if current_state_schema_version == target_state_schema_version:
            yield (
                'SUCCESS - Snapshot is already at latest schema version',
                item.id)
            return

        versioned_exploration_states = {
            'states_schema_version': current_state_schema_version,
            'states': item.content['states']
        }
        init_state_name = latest_exploration.init_state_name

        while current_state_schema_version < target_state_schema_version:
            exp_domain.Exploration.update_states_from_model(
                versioned_exploration_states,
                current_state_schema_version, init_state_name)
            current_state_schema_version += 1

            if target_state_schema_version == current_state_schema_version:
                yield ('SUCCESS - Model upgraded', 1)

        item.content['states'] = versioned_exploration_states['states']
        item.content['states_schema_version'] = current_state_schema_version
        item.update_timestamps(update_last_updated_time=False)
        item.put()

        yield ('SUCCESS - Model saved', 1)

    @staticmethod
    def reduce(key, values):
        if key.startswith('SUCCESS'):
            yield (key, len(values))
        else:
            yield (key, values)
