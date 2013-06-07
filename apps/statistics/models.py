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

"""Models for Oppia statistics."""

__author__ = 'Sean Lip'

import collections
import utils
import logging

from apps.exploration.models import Exploration

from google.appengine.ext import ndb


IMPROVE_TYPE_DEFAULT = 'default'
IMPROVE_TYPE_INCOMPLETE = 'incomplete'

STATS_ENUMS = utils.create_enum(
    'exploration_visited', 'rule_hit', 'exploration_completed',
    'feedback_submitted', 'state_hit')


def create_rule_name(rule):
    name = rule.name
    for key in rule.inputs.keys():
        left_paren = name.index('(')
        name = name[0:left_paren] + name[left_paren:].replace(
            key, str(rule.inputs[key]))
    return name


def get_event_key(event_name, key):
    if event_name == STATS_ENUMS.exploration_visited:
        return 'e.%s' % key
    if event_name == STATS_ENUMS.rule_hit:
        return 'default.%s' % str(key)
    if event_name == STATS_ENUMS.exploration_completed:
        return 'c.%s' % key
    if event_name == STATS_ENUMS.feedback_submitted:
        return 'f.%s' % key
    if event_name == STATS_ENUMS.state_hit:
        return 's.%s' % str(key)


class EventHandler(object):
    """Records events."""

    @classmethod
    def _record_event(cls, event_name, key, extra_info=''):
        """Updates statistics based on recorded events."""

        event_key = get_event_key(event_name, key)

        if event_name == STATS_ENUMS.exploration_visited:
            cls._inc(event_key)
        if event_name == STATS_ENUMS.rule_hit:
            cls._add(event_key, unicode(extra_info))
        if event_name == STATS_ENUMS.exploration_completed:
            cls._inc(event_key)
        if event_name == STATS_ENUMS.feedback_submitted:
            cls._add(event_key, unicode(extra_info))
        if event_name == STATS_ENUMS.state_hit:
            cls._inc(event_key)

    @classmethod
    def record_rule_hit(cls, exploration_id, state_id, rule, extra_info=''):
        """Records an event when an answer triggers the default rule."""
        cls._record_event(
            STATS_ENUMS.rule_hit, '%s.%s.%s' % (
                exploration_id, state_id, create_rule_name(rule)),
            extra_info)

    @classmethod
    def record_exploration_visited(cls, exploration_id):
        """Records an event when an exploration is first loaded."""
        cls._record_event(STATS_ENUMS.exploration_visited, exploration_id)

    @classmethod
    def record_exploration_completed(cls, exploration_id):
        """Records an event when an exploration is completed."""
        cls._record_event(STATS_ENUMS.exploration_completed, exploration_id)

    @classmethod
    def record_feedback_submitted(cls, url, feedback):
        """Records an event where feedback was submitted via the web UI."""
        cls._record_event(
            STATS_ENUMS.feedback_submitted, url, extra_info=feedback
        )

    @classmethod
    def record_state_hit(cls, exploration_id, state_id):
        """Record an event when a state is loaded."""
        cls._record_event(STATS_ENUMS.state_hit, '%s.%s' %
                          (exploration_id, state_id))

    @classmethod
    def _inc(cls, event_key):
        """Increments the counter corresponding to an event key."""
        counter = Counter.get_or_insert(event_key, name=event_key)
        if not counter:
            counter = Counter(id=event_key, name=event_key)
        counter.value += 1
        counter.put()

    @classmethod
    def _add(cls, event_key, value):
        """Adds to the list corresponding to an event key."""
        journal = Journal.get_or_insert(event_key, name=event_key)
        if not journal:
            journal = Journal(id=event_key, name=event_key)
        journal.values.append(value)
        journal.put()


class Counter(ndb.Model):
    """An integer-valued counter."""
    # The name of the property.
    name = ndb.StringProperty()
    # The value of the property.
    value = ndb.IntegerProperty(default=0)
    # When this counter was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this counter was last incremented.
    last_updated = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def get_value_by_id(cls, key):
        counter = Counter.get_by_id(key)
        if not counter:
            return 0
        else:
            return counter.value


class Journal(ndb.Model):
    """A list of values."""
    # The name of the list
    name = ndb.StringProperty()
    # The list of values
    values = ndb.StringProperty(repeated=True)
    # When this counter was first created.
    created = ndb.DateTimeProperty(auto_now_add=True)
    # When this counter was last updated.
    last_updated = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def get_value_count_by_id(cls, key):
        journal = Journal.get_by_id(key)
        if journal:
            return len(journal.values)
        else:
            return 0


class Statistics(object):
    """Retrieves statistics to display in the views."""

    @classmethod
    def get_exploration_stats(cls, event_name, exploration_id):
        """Retrieves statistics for the given event name and exploration id."""

        if event_name == STATS_ENUMS.exploration_visited:
            event_key = get_event_key(event_name, exploration_id)
            counter = Counter.get_by_id(event_key)
            if not counter:
                return 0
            return counter.value

        if event_name == STATS_ENUMS.exploration_completed:
            event_key = get_event_key(event_name, exploration_id)
            counter = Counter.get_by_id(event_key)
            if not counter:
                return 0
            return counter.value

        if event_name == STATS_ENUMS.rule_hit:
            result = {}

            exploration = Exploration.get(exploration_id)
            for state_key in exploration.states:
                state = state_key.get()
                result[state.id] = {
                    'name': state.name,
                    'rules': {}
                }
                for handler in state.widget.handlers:
                    for rule in handler.rules:
                        rule_name = create_rule_name(rule)
                        event_key = get_event_key(
                            event_name, '.'.join([exploration_id, state.id, rule_name]))

                        journal = Journal.get_by_id(event_key)

                        if journal:
                            top_ten = collections.Counter(
                                journal.values).most_common(10)
                        else:
                            top_ten = []

                        result[state.id]['rules'][rule_name] = {
                            'answers': top_ten,
                        }

            return result

        if event_name == STATS_ENUMS.state_hit:
            result = {}

            exploration = Exploration.get(exploration_id)
            for state_key in exploration.states:
                state = state_key.get()
                event_key = get_event_key(
                    event_name, '.'.join([exploration_id, state.id]))

                counter = Counter.get_by_id(event_key)
                if not counter:
                    count = 0
                else:
                    count = counter.value

                result[state.id] = {
                    'name': state.name,
                    'count': count,
                }
            return result

    @classmethod
    def get_top_ten_improvable_states(cls, exploration_ids):
        ranked_states = []
        for exp in exploration_ids:
            exploration = Exploration.get(exp)
            for state_db_key in exploration.states:
                state = state_db_key.get()
                state_key = '%s.%s' % (exp, state.id)

                # Get count of how many times the state was hit
                event_key = get_event_key(STATS_ENUMS.state_hit, state_key)
                all_count = Counter.get_value_by_id(event_key)
                if all_count == 0:
                    continue

                # Count the number of times the default rule was hit.
                event_key = get_event_key(
                    STATS_ENUMS.rule_hit, '%s.Default' % state_key)
                default_count = Journal.get_value_count_by_id(event_key)
                journal = Journal.get_by_id(event_key)
                if journal:
                    top_default_answers = collections.Counter(journal.values).most_common(5)
                else:
                    top_default_answers = []

                # Count the number of times an answer was submitted, regardless
                # of which rule it hits.
                completed_count = 0
                for handler in state.widget.handlers:
                    for rule in handler.rules:
                        rule_name = create_rule_name(rule)
                        event_key = get_event_key(
                            STATS_ENUMS.rule_hit, '%s.%s' %
                            (state_key, rule_name))
                        completed_count += Journal.get_value_count_by_id(
                            event_key)

                incomplete_count = all_count - completed_count

                state_rank, improve_type = 0, ''

                eligible_flags = []
                default_rule = filter(lambda rule: rule.name == 'Default', state.widget.handlers[0].rules)[0]
                default_self_loop = default_rule.dest == state.id
                if float(default_count) / all_count > .2 and default_self_loop:
                    eligible_flags.append({
                        'rank': default_count,
                        'improve_type': IMPROVE_TYPE_DEFAULT})
                if float(incomplete_count) / all_count > .2:
                    eligible_flags.append({
                        'rank': incomplete_count,
                        'improve_type': IMPROVE_TYPE_INCOMPLETE})

                eligible_flags = sorted(
                    eligible_flags, key=lambda flag: flag['rank'], reverse=True)
                if eligible_flags:
                    state_rank = eligible_flags[0]['rank']
                    improve_type = eligible_flags[0]['improve_type']

                ranked_states.append({'exp_id': exp, 'exp_name': exploration.title,
                                      'state_id': state.id, 'state_name': state.name,
                                      'rank': state_rank, 'type': improve_type,
                                      'top_default_answers': top_default_answers})

        problem_states = sorted(
            [state for state in ranked_states if state['rank'] != 0],
            key=lambda state: state['rank'],
            reverse=True)
        return problem_states[:10]
