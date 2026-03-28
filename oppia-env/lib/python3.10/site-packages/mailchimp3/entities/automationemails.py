# coding=utf-8
"""
The Automation Emails endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/emails/
Schema: https://api.mailchimp.com/schema/3.0/Automations/Emails/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.automationemailactions import AutomationEmailActions
from mailchimp3.entities.automationemailqueues import AutomationEmailQueues


class AutomationEmails(BaseApi):
    """
    Manage individual emails in an Automation workflow.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AutomationEmails, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None
        self.email_id = None
        self.actions = AutomationEmailActions(self)
        self.queues = AutomationEmailQueues(self)


    # Paid feature
    def all(self, workflow_id, get_all=False, **queryparams):
        """
        Get a summary of the emails in an Automation workflow.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: the query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.workflow_id = workflow_id
        self.email_id = None
        if get_all:
            return self._iterate(url=self._build_path(workflow_id, 'emails'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(workflow_id, 'emails'), **queryparams)


    # Paid feature
    def get(self, workflow_id, email_id):
        """
        Get information about an individual Automation workflow email.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        self.email_id = email_id
        return self._mc_client._get(url=self._build_path(workflow_id, 'emails', email_id))
