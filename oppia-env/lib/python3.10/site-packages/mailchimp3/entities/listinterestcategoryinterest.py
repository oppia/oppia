# coding=utf-8
"""
The List Interest Category Interests API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/interest-categories/interests/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Interests/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListInterestCategoryInterest(BaseApi):
    """
    Manage interests for a specific MailChimp list. Assign subscribers to
    interests to group them together. Interests are referred to as ‘group
    names’ in the MailChimp application.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListInterestCategoryInterest, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.category_id = None
        self.interest_id = None


    def create(self, list_id, category_id, data):
        """
        Create a new interest or ‘group name’ for a specific category.

        The documentation lists only the name request body parameter so it is
        being documented and error-checked as if it were required based on the
        description of the method.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*
        }
        """
        self.list_id = list_id
        self.category_id = category_id
        if 'name' not in data:
            raise KeyError('The list interest category interest must have a name')
        response =  self._mc_client._post(
            url=self._build_path(list_id, 'interest-categories', category_id, 'interests'),
            data=data
        )
        if response is not None:
            self.interest_id = response['id']
        else:
            self.interest_id = None
        return response


    def all(self, list_id, category_id, get_all=False, **queryparams):
        """
        Get a list of this category’s interests.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.list_id = list_id
        self.category_id = category_id
        self.interest_id = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'interest-categories', category_id, 'interests'), **queryparams)
        else:
            return self._mc_client._get(
                url=self._build_path(list_id, 'interest-categories', category_id, 'interests'),
                **queryparams
            )


    def get(self, list_id, category_id, interest_id, **queryparams):
        """
        Get interests or ‘group names’ for a specific category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param interest_id: The specific interest or ‘group name’.
        :type interest_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        self.category_id = category_id
        self.interest_id = interest_id
        return self._mc_client._get(
            url=self._build_path(list_id, 'interest-categories', category_id, 'interests', interest_id),
            **queryparams
        )


    def update(self, list_id, category_id, interest_id, data):
        """
        Update interests or ‘group names’ for a specific category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param interest_id: The specific interest or ‘group name’.
        :type interest_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*
        }
        """
        self.list_id = list_id
        self.category_id = category_id
        self.interest_id = interest_id
        if 'name' not in data:
            raise KeyError('The list interest category interest must have a name')
        return self._mc_client._patch(
            url=self._build_path(list_id, 'interest-categories', category_id, 'interests', interest_id),
            data=data
        )


    def delete(self, list_id, category_id, interest_id):
        """
        Delete interests or group names in a specific category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param interest_id: The specific interest or ‘group name’.
        :type interest_id: :py:class:`str`
        """
        self.list_id = list_id
        self.category_id = category_id
        self.interest_id = interest_id
        return self._mc_client._delete(
            url=self._build_path(list_id, 'interest-categories', category_id, 'interests', interest_id)
        )
