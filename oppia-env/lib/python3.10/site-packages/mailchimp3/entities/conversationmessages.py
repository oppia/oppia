# coding=utf-8
"""
The Conversation Messages API endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/conversations/messages/
Schema: https://api.mailchimp.com/schema/3.0/Conversations/Messages/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email


class ConversationMessages(BaseApi):
    """
    Manage messages in a specific campaign conversation.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ConversationMessages, self).__init__(*args, **kwargs)
        self.endpoint = 'conversations'
        self.conversation_id = None
        self.message_id = None


    # Paid feature
    def create(self, conversation_id, data):
        """
        Post a new message to a conversation.

        :param conversation_id: The unique id for the conversation.
        :type conversation_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "from_email": string*,
            "read": boolean*
        }
        """
        self.conversation_id = conversation_id
        if 'from_email' not in data:
            raise KeyError('The conversation message must have a from_email')
        check_email(data['from_email'])
        if 'read' not in data:
            raise KeyError('The conversation message must have a read')
        if data['read'] not in [True, False]:
            raise TypeError('The conversation message read must be True or False')
        response =  self._mc_client._post(url=self._build_path(conversation_id, 'messages'), data=data)
        if response is not None:
            self.message_id = response['id']
        else:
            self.message_id = None
        return response


    # Paid feature
    def all(self, conversation_id, **queryparams):
        """
        Get messages from a specific conversation.

        This endpoint does not currently support count and offset, preventing
        it from having the get_all parameter that most all() methods have

        :param conversation_id: The unique id for the conversation.
        :type conversation_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = p[
        queryparams['is_read'] = string
        queryparams['before_timestamp'] = string
        queryparams['since_timestamp'] = string
        """
        self.conversation_id = conversation_id
        self.message_id = None
        return self._mc_client._get(url=self._build_path(conversation_id, 'messages'), **queryparams)


    # Paid feature
    def get(self, conversation_id, message_id, **queryparams):
        """
        Get an individual message in a conversation.

        :param conversation_id: The unique id for the conversation.
        :type conversation_id: :py:class:`str`
        :param message_id: The unique id for the conversation message.
        :type message_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.conversation_id = conversation_id
        self.message_id = message_id
        return self._mc_client._get(url=self._build_path(conversation_id, 'messages', message_id), **queryparams)
