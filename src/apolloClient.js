import {ApolloClient, gql, InMemoryCache, HttpLink} from "@apollo/client";
import fetch from 'node-fetch';
//const {ApolloClient, gql, InMemoryCache, HttpLink} = require("@apollo/client");


const client = new ApolloClient({
    uri: 'https://us-central1-atlas-project-274801.cloudfunctions.net/api/graphql',
    cache: new InMemoryCache(),
});

export default client;