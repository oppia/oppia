# coding=utf-8
"""
The List Interest Categories API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/interest-categories/
Schema: https://api.mailchimp.com/schema/3.0/Lists/InterestCategories/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.listinterestcategoryinterest import ListInterestCategoryInterest


class ListInterestCategories(BaseApi):
    """
    Manage interest categories for a specific list. Interest categories
    organize interests, which are used to group subscribers based on their
    preferences. These correspond to ‘group titles’ in the MailChimp
    application.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListInterestCategories, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.category_id = None
        self.interests = ListInterestCategoryInterest(self)


    def create(self, list_id, data):
        """
        Create a new interest category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "title": string*,
            "type": string* (Must be one of 'checkboxes', 'dropdown', 'radio', or 'hidden')
        }
        """
        self.list_id = list_id
        if 'title' not in data:
            raise KeyError('The list interest category must have a title')
        if 'type' not in data:
            raise KeyError('The list interest category must have a type')
        if data['type'] not in ['checkboxes', 'dropdown', 'radio', 'hidden']:
            raise ValueError('The list interest category type must be one of "checkboxes", "dropdown", "radio", or '
                             '"hidden"')
        response = self._mc_client._post(url=self._build_path(list_id, 'interest-categories'), data=data)
        if response is not None:
            self.category_id = response['id']
        else:
            self.category_id = None
        return response


    def all(self, list_id, get_all=False, **queryparams):
        """
        Get information about a list’s interest categories.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['type'] = string
        """
        self.list_id = list_id
        self.category_id = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'interest-categories'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'interest-categories'), **queryparams)


    def get(self, list_id, category_id, **queryparams):
        """
        Get information about a specific interest category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        self.category_id = category_id
        return self._mc_client._get(url=self._build_path(list_id, 'interest-categories', category_id), **queryparams)


    def update(self, list_id, category_id, data):
        """
        Update a specific interest category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "title": string*,
            "type": string* (Must be one of 'checkboxes', 'dropdown', 'radio', or 'hidden')
        }
        """
        self.list_id = list_id
        self.category_id = category_id
        if 'title' not in data:
            raise KeyError('The list interest category must have a title')
        if 'type' not in data:
            raise KeyError('The list interest category must have a type')
        if data['type'] not in ['checkboxes', 'dropdown', 'radio', 'hidden']:
            raise ValueError('The list interest category type must be one of "checkboxes", "dropdown", "radio", or '
                             '"hidden"')
        return self._mc_client._patch(url=self._build_path(list_id, 'interest-categories', category_id), data=data)


    def delete(self, list_id, category_id):
        """
        Delete a specific interest category.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param category_id: The unique id for the interest category.
        :type category_id: :py:class:`str`
        """
        self.list_id = list_id
        self.category_id = category_id
        return self._mc_client._delete(url=self._build_path(list_id, 'interest-categories', category_id))
