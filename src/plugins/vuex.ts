/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import {
  ApolloClient, createHttpLink, gql, InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

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
    mapData: [],
    collections: [],
    userToken: null,
    user: undefined,
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
                        name,
                        id,
                        owner,
                        mapItems{
                            name,
                            objectId,
                            pos { x, y, z },
                            modelPath,
                            objectInfo { parameter, value },
                            scale,
                            defaultZoom,
                            owner,
                            ownerUsername,
                            collection,
                            children {
                                collectionId,
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
    async createMapItem(context, {
      collectionId, name, objectInfo, pos, rot, modelPath, defaultZoom, children, scale,
    }) {
      const res = await apolloClient.mutate({
        mutation: gql`
                mutation CreateMapItem(
                    $collectionId: ID!,
                    $name: String!,
                    $pos: Vector3Input!,
                    $rot: Vector3Input,
                    $objectInfo: [ObjectParameterInput!],
                    $scale: Float!,
                    $modelPath: String,
                    $defaultZoom: Float,
                    $children: [MapItemInput!]
                ){
                    createMapItem(
                        collectionId: $collectionId,
                        name: $name,
                        pos: $pos,
                        rot: $rot,
                        objectInfo: $objectInfo,
                        scale: $scale,
                        modelPath: $modelPath,
                        defaultZoom: $defaultZoom,
                        children: $children
                    ){
                        code,
                        mapItem {
                            children {
                                collectionId,
                                objectId
                            },
                            collection,
                            defaultZoom,
                            modelPath,
                            name,
                            objectId,
                            objectInfo {
                                parameter,
                                value
                            },
                            owner,
                            ownerUsername,
                            pos {x,y,z},
                            rot {x,y,z},
                            scale
                        },
                        message,
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
                mutation DeleteMapItem(
                    $collectionId: ID!
                    $objectId: ID!
                ){
                    deleteMapItem(
                        objectRef: {
                            objectId: $objectId,
                            collectionId: $collectionId
                        }
                    ){
                        code,
                        message,
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
    async editMapItem(context, {
      collectionId, name, objectInfo, pos, rot, modelPath, defaultZoom, children, scale, objectId,
    }) {
      const res = await apolloClient.mutate({
        mutation: gql`
                mutation EditMapItem(
                    $collectionId: ID!,
                    $name: String!,
                    $pos: Vector3Input!,
                    $rot: Vector3Input,
                    $objectInfo: [ObjectParameterInput!],
                    $scale: Float!,
                    $modelPath: String,
                    $defaultZoom: Float,
                    $children: [MapItemInput!],
                    $objectId: ID!
                ){
                    updateMapItem(
                        objectRef: {
                            collectionId: $collectionId,
                            objectId: $objectId
                        },
                        name: $name,
                        pos: $pos,
                        rot: $rot,
                        objectInfo: $objectInfo,
                        scale: $scale,
                        modelPath: $modelPath,
                        defaultZoom: $defaultZoom,
                        children: $children
                    ){
                        code,
                        mapItem {
                            children {
                                collectionId,
                                objectId
                            },
                            collection,
                            defaultZoom,
                            modelPath,
                            name,
                            objectId,
                            objectInfo {
                                parameter,
                                value
                            },
                            owner,
                            ownerUsername,
                            pos {x,y,z},
                            rot {x,y,z},
                            scale
                        },
                        message,
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
