# coding=utf-8
"""
The Automation Emails endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/emails/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class AutomationEmailActions(BaseApi):
    """
    Manage individual emails in an Automation workflow.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AutomationEmailActions, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None
        self.email_id = None


    # Paid feature
    def pause(self, workflow_id, email_id):
        """
        Pause an automated email.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        self.email_id = email_id
        return self._mc_client._post(url=self._build_path(workflow_id, 'emails', email_id, 'actions/pause'))


    # Paid feature
    def start(self, workflow_id, email_id):
        """
        Start an automated email.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        self.email_id = email_id
        return self._mc_client._post(url=self._build_path(workflow_id, 'emails', email_id, 'actions/start'))

    #Paid feature
    def delete(self, workflow_id, email_id):
        """
        Removes an individual Automation workflow email.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        """

        self.workflow_id = workflow_id
        self.email_id = email_id
        return self._mc_client._delete(url=self._build_path(workflow_id, 'emails', email_id))


