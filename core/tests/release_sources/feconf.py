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

"""Stores various configuration options and constants for Oppia."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE = 20

# The current version of the dashboard stats blob schema. If any backward-
# incompatible changes are made to the stats blob schema in the data store,
# this version number must be changed.
CURRENT_DASHBOARD_STATS_SCHEMA_VERSION = 1

# The current version of the exploration states blob schema. If any backward-
# incompatible changes are made to the states blob schema in the data store,
# this version number must be changed and the exploration migration job
# executed.
CURRENT_STATE_SCHEMA_VERSION = 3

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 4

# The current version of story contents dict in the story schema.
CURRENT_STORY_CONTENTS_SCHEMA_VERSION = 1
