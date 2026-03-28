# coding=utf-8
"""
The Conversations API endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/conversations/
Schema: https://api.mailchimp.com/schema/3.0/Conversations/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.conversationmessages import ConversationMessages


class Conversations(BaseApi):
    """
    Conversation tracking is a paid feature that lets you view subscribers’
    replies to your campaigns in your MailChimp account.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Conversations, self).__init__(*args, **kwargs)
        self.endpoint = 'conversations'
        self.conversation_id = None
        self.messages = ConversationMessages(self)


    # Paid feature
    def all(self, get_all=False, **queryparams):
        """
        Get a list of conversations for the account.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['has_unread_messages'] = string
        queryparams['list_id'] = string
        queryparams['campaign_id'] = string
        """
        self.conversation_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    # Paid feature
    def get(self, conversation_id, **queryparams):
        """
        Get details about an individual conversation.

        :param conversation_id: The unique id for the conversation.
        :type conversation_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.conversation_id = conversation_id
        return self._mc_client._get(url=self._build_path(conversation_id), **queryparams)
