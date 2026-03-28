# coding=utf-8
"""
The List Segment Members API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/segments/members/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Members/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email, check_subscriber_hash


class ListSegmentMembers(BaseApi):
    """
    Manage list members in a saved segment.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListSegmentMembers, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.segment_id = None
        self.subscriber_hash = None


    def create(self, list_id, segment_id, data):
        """
        Add a member to a static segment.

        The documentation does not currently elaborate on the path or request
        body parameters. Looking at the example provided, it will be assumed
        that email_address and status are required request body parameters and
        they are documented and error-checked as such.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "email_address": string*,
            "status": string* (Must be one of 'subscribed', 'unsubscribed', 'cleaned', or 'pending')
        }
        """
        self.list_id = list_id
        self.segment_id = segment_id
        if 'email_address' not in data:
            raise KeyError('The list segment member must have an email_address')
        check_email(data['email_address'])
        if 'status' not in data:
            raise KeyError('The list segment member must have a status')
        if data['status'] not in ['subscribed', 'unsubscribed', 'cleaned', 'pending']:
            raise ValueError('The list segment member status must be one of "subscribed", "unsubscribed", "cleaned" or'
                             '"pending"')
        response = self._mc_client._post(url=self._build_path(list_id, 'segments', segment_id, 'members'), data=data)
        if response is not None:
            self.subscriber_hash = response['id']
        else:
            self.subscriber_hash = None
        return response


    def all(self, list_id, segment_id, get_all=False, **queryparams):
        """
        Get information about members in a saved segment.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.list_id = list_id
        self.segment_id = segment_id
        self.subscriber_hash = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'segments', segment_id, 'members'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'segments', segment_id, 'members'), **queryparams)


    def delete(self, list_id, segment_id, subscriber_hash):
        """
        Remove a member from the specified static segment.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param segment_id: The unique id for the segment.
        :type segment_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.list_id = list_id
        self.segment_id = segment_id
        self.subscriber_hash = subscriber_hash
        return self._mc_client._delete(
            url=self._build_path(list_id, 'segments', segment_id, 'members', subscriber_hash)
        )
