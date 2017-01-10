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

"""Classes for informing subscribers when a new exploration is published."""

from core.domain import email_manager
from core.domain import exp_services

def inform_subscribers(creator_id, exploration_id):
    exploration = exp_services.get_exploration_by_id(exploration_id)
    email_manager.send_emails_to_subscribers(
        creator_id, exploration.id, exploration.title)
