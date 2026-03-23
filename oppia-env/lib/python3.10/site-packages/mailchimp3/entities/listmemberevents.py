# coding=utf-8
"""
The List Member Events API endpoint

Documentation: https://mailchimp.com/developer/reference/lists/list-members/list-member-events/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_subscriber_hash


class ListMemberEvents(BaseApi):
    """
    Use the Events endpoint to collect website or in-app actions and trigger targeted automations.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListMemberEvents, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.subscriber_hash = None

    def create(self, list_id, subscriber_hash, data):
        """
        Add an event for a list member.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*, (Must be 2-30 characters in length)
        }
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.list_id = list_id
        self.subscriber_hash = subscriber_hash
        if 'name' not in data:
            raise KeyError('The list member events must have a name')
        if len(data['name']) < 2 or len(data['name']) > 30:
            raise ValueError('The list member events name must be 2-30 in length')
        return self._mc_client._post(url=self._build_path(list_id, 'members', subscriber_hash, 'events'), data=data)

    def all(self, list_id, subscriber_hash, get_all=False, **queryparams):
        """
        Get events for a contact

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.list_id = list_id
        self.subscriber_hash = subscriber_hash
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'members', subscriber_hash, 'events'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'members', subscriber_hash, 'events'), **queryparams)
