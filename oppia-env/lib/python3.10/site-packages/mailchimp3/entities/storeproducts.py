# coding=utf-8
"""
The E-commerce Store Products API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/products/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Products/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.storeproductimages import StoreProductImages
from mailchimp3.entities.storeproductvariants import StoreProductVariants


class StoreProducts(BaseApi):
    """
    E-commerce items for sale in your store need to be created as Products so
    you can add the items to a Cart or an Order. Each Product requires at
    least one Product Variant.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreProducts, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.product_id = None
        self.images = StoreProductImages(self)
        self.variants = StoreProductVariants(self)


    def create(self, store_id, data):
        """
        Add a new product to a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "title": string*,
            "variants": array*
            [
                {
                    "id": string*,
                    "title": string*
                }
            ]
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The product must have an id')
        if 'title' not in data:
            raise KeyError('The product must have a title')
        if 'variants' not in data:
            raise KeyError('The product must have at least one variant')
        for variant in data['variants']:
            if 'id' not in variant:
                raise KeyError('Each product variant must have an id')
            if 'title' not in variant:
                raise KeyError('Each product variant must have a title')
        response = self._mc_client._post(url=self._build_path(store_id, 'products'), data=data)
        if response is not None:
            self.product_id = response['id']
        else:
            self.product_id = None
        return response


    def all(self, store_id, get_all=False, **queryparams):
        """
        Get information about a store’s products.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = store_id
        self.product_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'products'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'products'), **queryparams)


    def get(self, store_id, product_id, **queryparams):
        """
        Get information about a specific product.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.product_id = product_id
        return self._mc_client._get(url=self._build_path(store_id, 'products', product_id), **queryparams)


    def update(self, store_id, product_id, data):
        """
        Update a product.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.product_id = product_id
        return self._mc_client._patch(
            url=self._build_path(store_id, 'products', product_id),
            data=data
        )


    def delete(self, store_id, product_id):
        """
        Delete a product.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        """
        self.store_id = store_id
        self.product_id = product_id
        return self._mc_client._delete(url=self._build_path(store_id, 'products', product_id))
