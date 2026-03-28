# coding=utf-8
"""
The Automations API endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/
Schema: https://api.mailchimp.com/schema/3.0/Automations/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.automationactions import AutomationActions
from mailchimp3.entities.automationemails import AutomationEmails
from mailchimp3.entities.automationremovedsubscribers import AutomationRemovedSubscribers


class Automations(BaseApi):
    """
    Automation is a paid feature that lets you build a series of triggered
    emails that are sent to subscribers over a set period of time. Use the
    Automation API calls to manage Automation workflows, emails, and queues.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Automations, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None
        self.actions = AutomationActions(self)
        self.emails = AutomationEmails(self)
        self.removed_subscribers = AutomationRemovedSubscribers(self)


    # Paid feature
    def all(self, get_all=False, **queryparams):
        """
        Get a summary of an account’s Automations.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: the query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.workflow_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    # Paid feature
    def get(self, workflow_id, **queryparams):
        """
        Get a summary of an individual Automation workflow’s settings and
        content. The trigger_settings object returns information for the first
        email in the workflow.

        :param workflow_id: The unique id for the Automation workflow
        :type workflow_id: :py:class:`str`
        :param queryparams: the query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.workflow_id = workflow_id
        return self._mc_client._get(url=self._build_path(workflow_id), **queryparams)
