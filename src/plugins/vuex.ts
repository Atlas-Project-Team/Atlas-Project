/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import {
  ApolloClient, createHttpLink, gql, InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import firebase from 'firebase/app';

firebase.initializeApp({
  apiKey: 'AIzaSyButkqFXtrI90FUM-l7O-nWz-3TxIwd_0U',
  authDomain: 'atlas-project-274801.firebaseapp.com',
  databaseURL: 'https://atlas-project-274801.firebaseio.com',
  projectId: 'atlas-project-274801',
  storageBucket: 'atlas-project-274801.appspot.com',
  messagingSenderId: '807372296549',
  appId: '1:807372296549:web:b1e8fc3be8c2a27488918c',
  measurementId: 'G-40XQC6G6E4',
});

Vue.use(Vuex);

const endpoint = 'https://us-central1-atlas-project-274801.cloudfunctions.net/api';
// const endpoint = 'http://localhost:5001/atlas-project-274801/us-central1/api';

const httpLink = createHttpLink({
  uri: endpoint,
});

let authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
  },
}));

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    addTypename: false,
  }),
});

const store = new Vuex.Store({
  state: {
    firebase,
    mapData: [],
    collections: [],
    userToken: null,
    user: undefined,
    assets: <Map<string, Promise<string> | string>> new Map(),
    assetsLoaded: 0,
    assetsRequested: 0,
  },
  getters: {
    assets: (state) => (assetPath: string) => {
      // Check if we've already queued a download for this asset.
      if (state.assets.has(assetPath)) {
        return state.assets.get(assetPath);
      }

      // Fetch the asset from Google Cloud Storage
      // as it provides direct http access and caching versus firebase storage
      // Then create a local url for the blob and return that finally for quick loading.
      const url = `https://storage.googleapis.com/atlas-project-274801.appspot.com/Assets/${assetPath}`;
      state.assetsRequested += 1;
      const promise = fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'default',
      })
        .then((res) => res.blob())
        .then((blob) => {
          state.assetsLoaded += 1;
          return URL.createObjectURL(blob);
        });

      // Set the promise as the value of the path in the assets map
      state.assets.set(assetPath, promise);
      // Finally, return the promise as the result of the initial request.
      return promise;
    },
  },
  mutations: {
    setMapData(state, newMapData) {
      state.mapData = newMapData;
    },
    setCollections(state, newCollections) {
      state.collections = newCollections;
    },
    setUserToken(state, newUserToken) {
      state.userToken = newUserToken;

      authLink = setContext((_, { headers }) => ({
        headers: {
          ...headers,
          authorization: store.state.userToken ? `Bearer ${store.state.userToken}` : '',
        },
      }));

      apolloClient.setLink(authLink.concat(httpLink));
    },
    setUser(state, newUser) {
      state.user = newUser;
    },
    addMapItem(state, newMapItem) {
      state.mapData.push(newMapItem);
    },
    deleteMapItem(state, mapItemId) {
      state.mapData = state.mapData.filter((item) => item.objectId !== mapItemId);
    },
  },
  actions: {
    async refreshMapData({ commit }) {
      const res = await apolloClient.query({
        query: gql`
                  query {
                      getCollections {
                          name
                          id
                          owner
                          mapItems {
                              name
                              objectId
                              pos {
                                  x
                                  y
                                  z
                              }
                              modelPath
                              objectInfo {
                                  parameter
                                  value
                              }
                              scale
                              defaultZoom
                              owner
                              ownerUsername
                              collection
                              children {
                                  collectionId
                                  objectId
                              }
                          }
                      }
                  }
              `,
      });
      if (res) {
        const collectionsArray = res.data.getCollections;
        const mapData: any[] = [];

        collectionsArray.forEach((collection: any) => {
          mapData.push(...collection.mapItems);
        });

        commit('setMapData', mapData);
        commit('setCollections', collectionsArray);
      }
    },
    async createMapItem(
      context,
      {
        collectionId, name, objectInfo, pos, rot, modelPath, defaultZoom, children, scale,
      },
    ) {
      const res = await apolloClient.mutate({
        mutation: gql`
                  mutation CreateMapItem(
                      $collectionId: ID!
                      $name: String!
                      $pos: Vector3Input!
                      $rot: Vector3Input
                      $objectInfo: [ObjectParameterInput!]
                      $scale: Float!
                      $modelPath: String
                      $defaultZoom: Float
                      $children: [MapItemInput!]
                  ) {
                      createMapItem(
                          collectionId: $collectionId
                          name: $name
                          pos: $pos
                          rot: $rot
                          objectInfo: $objectInfo
                          scale: $scale
                          modelPath: $modelPath
                          defaultZoom: $defaultZoom
                          children: $children
                      ) {
                          code
                          mapItem {
                              children {
                                  collectionId
                                  objectId
                              }
                              collection
                              defaultZoom
                              modelPath
                              name
                              objectId
                              objectInfo {
                                  parameter
                                  value
                              }
                              owner
                              ownerUsername
                              pos {
                                  x
                                  y
                                  z
                              }
                              rot {
                                  x
                                  y
                                  z
                              }
                              scale
                          }
                          message
                          success
                      }
                  }
              `,
        variables: {
          collectionId,
          name,
          objectInfo,
          pos,
          rot,
          modelPath,
          defaultZoom,
          children,
          scale,
        },
      });
      if (res.data.createMapItem.success) {
        context.commit('addMapItem', res.data.createMapItem.mapItem);
        return res.data.createMapItem;
      }
      throw new Error(`${res.data.createMapItem.code}: ${res.data.createMapItem.message}`);
    },
    async deleteMapItem(context, { objectId, collection }) {
      const res = await apolloClient.mutate({
        mutation: gql`
                  mutation DeleteMapItem($collectionId: ID!, $objectId: ID!) {
                      deleteMapItem(objectRef: { objectId: $objectId, collectionId: $collectionId }) {
                          code
                          message
                          success
                      }
                  }
              `,
        variables: {
          objectId,
          collectionId: collection,
        },
      });
      if (res.data.deleteMapItem.success) {
        context.commit('deleteMapItem', objectId);
        return;
      }
      throw new Error(`${res.data.deleteMapItem.code}: ${res.data.deleteMapItem.message}`);
    },
    async editMapItem(
      context,
      {
        collectionId,
        name,
        objectInfo,
        pos,
        rot,
        modelPath,
        defaultZoom,
        children,
        scale,
        objectId,
      },
    ) {
      const res = await apolloClient.mutate({
        mutation: gql`
                  mutation EditMapItem(
                      $collectionId: ID!
                      $name: String!
                      $pos: Vector3Input!
                      $rot: Vector3Input
                      $objectInfo: [ObjectParameterInput!]
                      $scale: Float!
                      $modelPath: String
                      $defaultZoom: Float
                      $children: [MapItemInput!]
                      $objectId: ID!
                  ) {
                      updateMapItem(
                          objectRef: { collectionId: $collectionId, objectId: $objectId }
                          name: $name
                          pos: $pos
                          rot: $rot
                          objectInfo: $objectInfo
                          scale: $scale
                          modelPath: $modelPath
                          defaultZoom: $defaultZoom
                          children: $children
                      ) {
                          code
                          mapItem {
                              children {
                                  collectionId
                                  objectId
                              }
                              collection
                              defaultZoom
                              modelPath
                              name
                              objectId
                              objectInfo {
                                  parameter
                                  value
                              }
                              owner
                              ownerUsername
                              pos {
                                  x
                                  y
                                  z
                              }
                              rot {
                                  x
                                  y
                                  z
                              }
                              scale
                          }
                          message
                          success
                      }
                  }
              `,
        variables: {
          collectionId,
          objectId,
          name,
          objectInfo,
          pos,
          rot,
          modelPath,
          defaultZoom,
          children,
          scale,
        },
      });
      if (res.data.updateMapItem.success) {
        context.commit('deleteMapItem', res.data.updateMapItem.mapItem.objectId);
        context.commit('addMapItem', res.data.updateMapItem.mapItem);
        return res.data.updateMapItem;
      }
      throw new Error(`${res.data.updateMapItem.code}: ${res.data.updateMapItem.message}`);
    },
  },
});

export default store;
