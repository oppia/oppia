# coding: utf-8
#
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

"""Commands that can be used to upgrade draft to newer Exploration versions."""
import logging

from core.domain import exp_domain
from core.platform import models

(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])


def try_upgrade_from_version_to_version(
        draft_change_list, from_version, to_version, exp_id):
    """Try upgrading an ExplorationChange domain object by calling convert
    functions for a list of commits.

    For now, this handles only the scenario where commits_list contains a
    single commit that migrates the state schema.

    Args:
        draft_change_list: list(dict). Each dict can be parsed as an
            ExplorationChange domain object.
        from_version: int. Current draft version.
        to_version: int. Target exploration version.
        exp_id: string. Exploration id.
    Returns:
        draft_change_list: list(dict). Upgraded change list. None if upgrade
        failed.
    """
    if from_version >= to_version:
        return
    exp_versions = range(from_version + 1, to_version + 1)
    commits_list = [
        exp_models.ExplorationCommitLogEntryModel.get_commit(
            exp_id, exp_version) for exp_version in exp_versions]
    upgrade_times = 0
    while from_version + upgrade_times < to_version:
        commit = commits_list[upgrade_times]
        if (
                len(commit.commit_cmds) == 1 and
                commit.commit_cmds[0]['cmd'] ==
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):

            conversion_fn_name = '_convert_v%s_dict_to_v%s_dict' % (
                (from_version + upgrade_times),
                (from_version + upgrade_times + 1))
            if not hasattr(DraftUpgradeUtil, conversion_fn_name):
                logging.warning('%s is not implemented' % conversion_fn_name)
                return None
            conversion_fn = getattr(DraftUpgradeUtil, conversion_fn_name)
            draft_change_list = conversion_fn(draft_change_list)
            if not draft_change_list:
                logging.warning(
                    'Cannot upgrade due to %s is not defined' %
                    conversion_fn_name)
                return
        else:
            return
        upgrade_times += 1
    if from_version + upgrade_times >= to_version:
        return draft_change_list


class DraftUpgradeUtil(object):
    """Wrapper class that contains util functions to upgrade drafts."""
    pass
