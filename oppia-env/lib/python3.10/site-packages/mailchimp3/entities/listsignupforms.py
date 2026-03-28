# coding=utf-8
"""
The List Signup Forms API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/signup-forms/
Schema: https://api.mailchimp.com/schema/3.0/Lists/SignupForms/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListSignupForms(BaseApi):
    """
    Manage list signup forms.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListSignupForms, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None


    def create(self, list_id, data):
        """
        Create a customized list signup form.

        No fields are listed as required in the documentation and the
        description of the method does not indicate any required fields
        either.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.list_id = list_id
        response = self._mc_client._post(url=self._build_path(list_id, 'signup-forms'), data=data)
        return response


    def all(self, list_id):
        """
        Get signup forms for a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        """
        self.list_id = list_id
        return self._mc_client._get(url=self._build_path(list_id, 'signup-forms'))
