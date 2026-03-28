# coding=utf-8
"""
The E-commerce Store Customers API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/customers/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Customers/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email


class StoreCustomers(BaseApi):
    """
    Add Customers to your Store to track their orders and to view E-Commerce
    Data for your MailChimp lists and campaigns. Each Customer is connected to
    a MailChimp list member, so adding a Customer can also add or update a
    list member.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreCustomers, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.customer_id = None


    def create(self, store_id, data):
        """
        Add a new customer to a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "email_address": string*,
            "opt_in_status": boolean*
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The store customer must have an id')
        if 'email_address' not in data:
            raise KeyError('The store customer must have an email_address')
        check_email(data['email_address'])
        if 'opt_in_status' not in data:
            raise KeyError('The store customer must have an opt_in_status')
        if data['opt_in_status'] not in [True, False]:
            raise TypeError('The opt_in_status must be True or False')
        response = self._mc_client._post(url=self._build_path(store_id, 'customers'), data=data)
        if response is not None:
            self.customer_id = response['id']
        else:
            self.customer_id = None
        return response


    def all(self, store_id, get_all=False, **queryparams):
        """
        Get information about a store’s customers.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['email_address'] = string
        """
        self.store_id = store_id
        self.customer_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'customers'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'customers'), **queryparams)


    def get(self, store_id, customer_id, **queryparams):
        """
        Get information about a specific customer.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param customer_id: The id for the customer of a store.
        :type customer_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.customer_id = customer_id
        return self._mc_client._get(url=self._build_path(store_id, 'customers', customer_id), **queryparams)


    def update(self, store_id, customer_id, data):
        """
        Update a customer.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param customer_id: The id for the customer of a store.
        :type customer_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.customer_id = customer_id
        return self._mc_client._patch(url=self._build_path(store_id, 'customers', customer_id), data=data)


    def create_or_update(self, store_id, customer_id, data):
        """
        Add or update a customer.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param customer_id: The id for the customer of a store.
        :type customer_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "email_address": string*,
            "opt_in_status": boolean
        }
        """
        self.store_id = store_id
        self.customer_id = customer_id
        if 'id' not in data:
            raise KeyError('The store customer must have an id')
        if 'email_address' not in data:
            raise KeyError('Each store customer must have an email_address')
        check_email(data['email_address'])
        if 'opt_in_status' not in data:
            raise KeyError('The store customer must have an opt_in_status')
        if data['opt_in_status'] not in [True, False]:
            raise TypeError('The opt_in_status must be True or False')
        return self._mc_client._put(url=self._build_path(store_id, 'customers', customer_id), data=data)


    def delete(self, store_id, customer_id):
        """
        Delete a customer from a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param customer_id: The id for the customer of a store.
        :type customer_id: :py:class:`str`
        """
        self.store_id = store_id
        self.customer_id = customer_id
        return self._mc_client._delete(url=self._build_path(store_id, 'customers', customer_id))
