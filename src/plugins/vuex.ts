/* eslint-disable no-param-reassign */
import Vue from 'vue';
import Vuex from 'vuex';
import { createApolloFetch } from 'apollo-fetch';

Vue.use(Vuex);

const fetch = createApolloFetch({
  uri: 'https://us-central1-atlas-project-274801.cloudfunctions.net/api',
});

const store = new Vuex.Store({
  state: {
    mapData: [],
    userToken: undefined,
  },
  mutations: {
    setMapData(state, newMapData) {
      state.mapData = newMapData;
    },
    setUserToken(state, newUserToken) {
      state.userToken = newUserToken;
    },
    createMapItem(state, args) {
      /* apolloClient
        .mutate({
          mutation: gql`
            mutation {
                CreateMapItem: createMapItem(
                    collectionId: ${args.collectionId},
                    name: ${args.name},
                    pos: ${args.pos},
                    rot: ${args.rot},
                    objectInfo: ${args.objectInfo},
                    scale: ${args.scale},
                    modelPath: ${args.modelPath},
                    defaultZoom: ${args.defaultZoom},
                    children: ${args.children}
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
                        pos {x,y,z},
                        rot {x,y,z},
                        scale
                    },
                    message,
                    success
                }
            }
          `,
        })
        .then((res) => {
          console.log(res);
        }); */
    },
  },
  actions: {
    async refreshMapData(context) {
      const res = await fetch({
        query: `
            query {
              getMapData {
                name,
                objectId,
                pos {x,y,z},
                modelPath,
                objectInfo {
                    parameter,
                    value
                },
                scale,
                defaultZoom,
                owner,
              }
            }
          `,
      });
      if (res) {
        context.commit('setMapData', res.data.getMapData);
      }
    },
  },
});

fetch.use(({ options }, next) => {
  if (!options.headers) {
    options.headers = {};
  }
  if (store.state.userToken) {
    // @ts-ignore
    options.headers.authorization = `Bearer ${store.state.userToken}`;
  }

  next();
});

export default store;
