const functions = require('firebase-functions');
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
const admin = require('firebase-admin');
const {error} = require("firebase-functions/lib/logger");
const serviceAccount = require('./service-account.json');
const {oAuthConfig} = require('./info');
const fetch = require('node-fetch');
const {ApolloServer, gql} = require('apollo-server-cloud-functions');
const _ = require('lodash');
const uuid = require('uuid');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "atlas-project-274801.appspot.com"
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

const typeDefs = gql`
    type Query {
        getCollections: [MapCollection!]!,
        getMapData: [MapItem!]!,
        getUserName(uid: ID): String
    }

    type Mutation {
        updateCollection(
            id: ID!,
            name: String,
            owner: ID
        ): CollectionMutationResponse,
        
        createCollection(
            name: String!
        ): CollectionMutationResponse,
        
        deleteCollection(
            id: ID!
        ): CollectionMutationResponse,
        
        updateMapItem(
            objectRef: MapItemInput!,
            name: String,
            objectInfo: [ObjectParameterInput!],
            pos: Vector3Input,
            rot: Vector3Input,
            scale: Float,
            modelPath: String,
            defaultZoom: Float,
            children: [MapItemInput!]
        ): MapItemMutationResponse,
        
        createMapItem(
            collectionId: ID!,
            name: String!,
            objectInfo: [ObjectParameterInput!],
            pos: Vector3Input!,
            rot: Vector3Input,
            scale: Float!,
            modelPath: String,
            defaultZoom: Float,
            children: [MapItemInput!]
        ): MapItemMutationResponse,
        
        deleteMapItem(
            objectRef: MapItemInput!
        ): MapItemMutationResponse
    }

    type MapItemReference {
        collectionId: ID!,
        objectId: ID!
    }

    input MapItemInput {
        collectionId: ID!,
        objectId: ID!
    }

    type CollectionMutationResponse implements MutationResponse {
        code: String!,
        success: Boolean!,
        message: String!,
        collection: MapCollection
    }

    type MapItemMutationResponse implements MutationResponse {
        code: String!,
        success: Boolean!,
        message: String!,
        mapItem: MapItem
    }

    interface MutationResponse {
        code: String!,
        success: Boolean!,
        message: String!
    }

    type MapItem {
        children: [MapItemReference!]!,
        defaultZoom: Float!,
        modelPath: String!,
        name: String!,
        objectInfo: [ObjectParameter!]!,
        owner: String!,
        pos: Vector3!,
        rot: Vector3,
        scale: Float,
        objectId: ID!,
        collection: ID!
    }

    type MapCollection {
        name: String!,
        mapItems: [MapItem!]!,
        owner: ID!,
        visibility: String,
        id: ID!
    }

    type ObjectParameter {
        parameter: String!,
        value: String!
    }

    input ObjectParameterInput {
        parameter: String!,
        value: String!
    }

    type Vector3 {
        x: Float!,
        y: Float!,
        z: Float!
    }

    input Vector3Input {
        x: Float!,
        y: Float!,
        z: Float!
    }
`;

const dataFormatters = {
    firebaseToQuery: {
        collection: function (data, id) {
            data.name = data.collectionName;
            data.id = id;
            data.mapItems.map((mapItem, index) => dataFormatters.firebaseToQuery.mapItem(mapItem, id, data.owner));
            return data;
        },
        mapItem: function (mapItem, collectionId, collectionOwner) {
            mapItem.collection = collectionId;
            mapItem.owner = collectionOwner;
            return mapItem;
        }
    }
}

const resolvers = {
    Query: {
        getCollections: async (parent, args, context, info) => {
            let collections = [];
            let querySnapshot = await db.collection("mapCollections").where("owner", "in", (context.req.user ? ['', context.req.user.uid] : [''])).get()
            querySnapshot.forEach((doc) => {
                let data = doc.data();
                collections.push(dataFormatters.firebaseToQuery.collection(data, doc.id));
            });
            return collections;
        },
        getMapData: async (parent, args, context, info) => {
            let mapData = [];
            let querySnapshot = await db.collection("mapCollections").where("owner", "in", (context.req.user ? ['', context.req.user.uid] : [''])).get()
            querySnapshot.forEach((doc) => {
                let data = doc.data();
                data.mapItems.map((mapItem, index) => dataFormatters.firebaseToQuery.mapItem(mapItem, doc.id, data.owner));
                mapData.push(...data.mapItems);
            });
            return mapData;
        },
        getUserName: async (parent, args, context, info) => {
            console.log(context.req.user);
            if (args.uid) {
                let user = await admin.auth().getUser(args.uid);
                if (user) {
                    return user.displayName;
                }
                return null
            } else {
                if (context.req.user) {
                    return context.req.user.name;
                }
                return null;
            }
        }
    },
    Mutation: {
        updateCollection: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                collection: null
            }
            let existingCollectionRef = db.collection('mapCollections').doc(args.id)
            let existingCollection = await existingCollectionRef.get();
            if (!existingCollection.exists) {
                res.code = "Collection Not Found";
                res.message = "There were no collections found in the database at this id. Did you make sure you used a valid id?";
            } else if (existingCollection.data().owner !== "") {
                if (context.req.user) {
                    if (context.req.user.uid === existingCollection.data().owner) {
                        // Valid authentication.
                        let properties = Object.keys(args);
                        let updateObject = {};
                        if (properties.includes("name")) {
                            if (args.name.trim() !== "") {
                                updateObject.collectionName = args.name;
                            } else {
                                res.code = "Invalid Argument";
                                res.message = "You have supplied a name that does not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid collection names.";
                                return res;
                            }
                        }
                        if (properties.includes("owner")) {
                            let checkUser = await admin.auth().getUser(args.owner);
                            if (checkUser) {
                                // UID Exists.
                                updateObject.owner = args.owner;
                            } else {
                                res.code = "Invalid Argument";
                                res.message = "You have supplied a uid that does not exist in the application. The query has been terminated to prevent orphaned collections.";
                                return res;
                            }
                        }
                        if (Object.keys(updateObject).length > 0) {
                            if (Object.keys(updateObject).every(key => existingCollection.data()[key] === updateObject[key])) {
                                res.code = "No Changes.";
                                res.success = true;
                                res.message = "The changes have already been applied. No operation occurred.";
                                res.collection = dataFormatters.firebaseToQuery.collection(existingCollection.data(), existingCollection.id);
                                return res
                            } else {
                                let updateRes = await existingCollectionRef.update(updateObject);
                                if (updateRes) {
                                    res.code = "Success";
                                    res.success = true;
                                    res.message = "The changes have been applied.";
                                    let result = dataFormatters.firebaseToQuery.collection(existingCollection.data(), existingCollection.id);
                                    Object.keys(args).filter(arg => ['name', 'owner'].includes(arg)).forEach(key => {
                                        result[key] = args[key]
                                    })
                                    res.collection = result;
                                    return res
                                }
                            }
                        } else {
                            res.code = "No Arguments";
                            res.success = true;
                            res.message = "You did not supply any arguments, as a result, nothing was changed... successfully?";
                            res.collection = dataFormatters.firebaseToQuery.collection(existingCollection.data(), existingCollection.id);
                            return res
                        }
                    } else {
                        res.code = "Access Denied";
                        res.message = "You are not signed in to a valid Atlas user account. Please ensure you have used a valid and current auth token.";
                    }
                } else {
                    res.code = "Access Denied";
                    res.message = "You are not signed in to a valid Atlas user account. Please ensure you have used a valid and current auth token.";
                }
            } else {
                res.code = "Access Denied";
                res.message = "You cannot modify owner-less resources via the api.";
            }
            return res;
        },
        createCollection: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                collection: null
            }
            if (context.req.user) {
                let collectionObject = {};
                collectionObject.owner = context.req.user.uid;
                if (args.name.trim() === "") {
                    res.code = "Invalid Argument";
                    res.message = "You have supplied a name that does not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid collection names.";
                    return res;
                }
                collectionObject.collectionName = args.name;
                collectionObject.visibility = "Private";
                collectionObject.mapItems = [];
                const docRef = await db.collection('mapCollections').add(collectionObject);
                const doc = await docRef.get();
                let data = doc.data();
                res.collection = dataFormatters.firebaseToQuery.collection(data, doc.id);
                res.code = "Success";
                res.success = true;
                res.message = "The collection has been created.";
            } else {
                res.code = "Access Denied";
                res.message = "You must be signed in to create a collection.";
            }
            return res
        },
        deleteCollection: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                collection: null
            }
            if (context.req.user) {
                let existingCollectionRef = db.collection('mapCollections').doc(args.id)
                let existingCollection = await existingCollectionRef.get();
                if (!existingCollection.exists) {
                    res.code = "Collection Not Found";
                    res.message = "There were no collections found in the database at this id. Did you make sure you used a valid id?";
                    return res;
                } else if (existingCollection.data().owner !== "") {
                    if (existingCollection.data().owner === context.req.user.uid) {
                        // Correct user
                        const docRef = await existingCollectionRef.delete();
                        if (docRef) {
                            res.code = "Success";
                            res.success = true;
                            res.message = "The collection has been deleted.";
                        } else {
                            res.code = "Null Response";
                            res.success = false;
                            res.message = "The database returned a null response. The collection may have still been deleted successfully, but you should attempt to retrieve it to verify this.";
                        }
                    } else {
                        res.code = "Access Denied";
                        res.message = "You cannot delete a collection that is owned by someone else.";
                    }
                } else {
                    res.code = "Access Denied";
                    res.message = "You cannot delete owner-less resources via the api.";
                }
            } else {
                res.code = "Access Denied";
                res.message = "You must be signed in to delete a collection.";
            }
            return res
        },
        updateMapItem: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                mapItem: null
            }
            let existingCollectionRef = db.collection('mapCollections').doc(args.objectRef.collectionId)
            let existingCollection = await existingCollectionRef.get();
            if (!existingCollection.exists) {
                res.code = "Collection Not Found";
                res.message = "There were no collections found in the database at this id. Did you make sure you used a valid id?";
            } else if (existingCollection.data().owner !== "") {
                if (context.req.user) {
                    if (context.req.user.uid === existingCollection.data().owner) {
                        // Valid authentication.
                        let existingMapItems = existingCollection.data().mapItems;
                        let originalMapItems = _.cloneDeep(existingMapItems); // https://www.youtube.com/watch?v=g5JYM_MSe2Y
                        let existingMapItemIds = existingMapItems.map(mapItem => mapItem.objectId);
                        if (existingMapItemIds.includes(args.objectRef.objectId)){
                            // Map Item exists.
                            let existingMapItem = existingMapItems.find(mapItem => mapItem.objectId === args.objectRef.objectId);
                            // The way this is set up requires a daily ritual to the gods of pass-by-object-ref variables so if shit goes wrong it's probably because of this.
                            // ...but this is easier and it *should* work so fuck it. I'll fix it when it's an issue.
                            let properties = Object.keys(args);
                            properties = properties.filter(p=>p!=='objectRef');
                            if (properties.includes("name")) {
                                if (args.name.trim() !== "") {
                                    existingMapItem.name = args.name;
                                } else {
                                    res.code = "Invalid Argument";
                                    res.message = "You have supplied a name that does not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid map item names.";
                                    return res;
                                }
                            }
                            if (properties.includes("objectInfo")) {
                                if(args.objectInfo.every(objectProperty => objectProperty.parameter.trim() !== "" && objectProperty.value.trim() !== "")){
                                    existingMapItem.objectInfo = args.objectInfo.map(objectInfo=>{return {parameter:objectInfo.parameter, value:objectInfo.value}});
                                }else{
                                    res.code = "Invalid Argument";
                                    res.message = "One or more objectInfo properties or values do not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid map item names.";
                                    return res;
                                }
                            }
                            if (properties.includes("pos")){
                                existingMapItem.pos = {x:args.pos.x, y:args.pos.y, z:args.pos.z};
                            }
                            if (properties.includes("rot")) {
                                existingMapItem.rot = {x:args.rot.x, y:args.rot.y, z:args.rot.z};
                            }
                            if (properties.includes("scale")) {
                                if (args.scale > 0) {
                                    existingMapItem.scale = args.scale;
                                } else {
                                    res.code = "Invalid Argument";
                                    res.message = "The provided scale was less than or equal to zero. Here at Atlas, we like our objects large enough to exist, so we're kindly asking you to please not.";
                                    return res;
                                }
                            }
                            if (properties.includes("defaultZoom")) {
                                if (args.defaultZoom > 0) {
                                    existingMapItem.defaultZoom = args.defaultZoom;
                                } else {
                                    res.code = "Invalid Argument";
                                    res.message = "The provided default zoom was less than or equal to zero. Here at Atlas, we like to look at objects from further than *literally being in the exact same position as them* away, so kindly give a default zoom above zero.";
                                    return res;
                                }
                            }
                            if (properties.includes("modelPath")) {
                                let modelPath = `MR/models/${args.modelPath}/model.glb`;
                                let file = bucket.file(modelPath);
                                let fileExists = (await file.exists())[0];
                                if(fileExists){
                                    // Valid model
                                    existingMapItem.modelPath = args.modelPath;
                                }else{
                                    res.code = "Invalid Argument";
                                    res.message = "The model path you provided does not match any known object in the observable universe. Or at least, it doesn't match anything on our server.";
                                    return res;
                                }
                            }
                            if (properties.includes("children")){
                                if(await args.children.every(async(childRef)=>{
                                    let childCollectionRef = db.collection('mapCollections').doc(childRef.collectionId)
                                    let childCollection = await childCollectionRef.get();
                                    if (!childCollection.exists){
                                        return false;
                                    }
                                    let childMapItemIds = childCollection.data().mapItems.map(mapItem => mapItem.objectId);
                                    return childMapItemIds.includes(childRef.objectId);
                                })){
                                    existingMapItem.children = args.children.map(childRef=>{return {collectionId:childRef.collectionId, objectId:childRef.objectId}});
                                } else {
                                    res.code = "Invalid Argument";
                                    res.message = "One of the children provided, or the collection they are in do not exist in our database. Mysterious...";
                                    return res;
                                }
                            }
                            if (properties.length > 0) {
                                if (_.isEqual(originalMapItems, existingMapItems)) {
                                    res.code = "No Changes.";
                                    res.success = true;
                                    res.message = "The changes have already been applied. No operation occurred.";
                                    res.collection = dataFormatters.firebaseToQuery.collection(existingCollection.data(), existingCollection.id);
                                    return res
                                } else {
                                    let updateRes = await existingCollectionRef.update({mapItems: existingMapItems});
                                    if (updateRes) {
                                        res.code = "Success";
                                        res.success = true;
                                        res.message = "The changes have been applied.";
                                        res.mapItem = dataFormatters.firebaseToQuery.mapItem(existingMapItem, existingCollection.id, existingCollection.data().owner);
                                        return res
                                    }
                                }
                            } else {
                                res.code = "No Arguments";
                                res.success = true;
                                res.message = "You did not supply any arguments, as a result, nothing was changed... successfully?";
                                res.collection = dataFormatters.firebaseToQuery.collection(existingCollection.data(), existingCollection.id);
                                return res
                            }
                        }else{
                            res.code = "Map Item Not Found";
                            res.message = "There were no map items found in the collection at this id. Did you make sure you used a valid id?";
                            return res;
                        }
                    } else {
                        res.code = "Access Denied";
                        res.message = "You are not signed in to a valid Atlas user account. Please ensure you have used a valid and current auth token.";
                    }
                } else {
                    res.code = "Access Denied";
                    res.message = "You are not signed in to a valid Atlas user account. Please ensure you have used a valid and current auth token.";
                }
            } else {
                res.code = "Access Denied";
                res.message = "You cannot modify owner-less resources via the api.";
            }
            return res;
        },
        createMapItem: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                collection: null
            }
            let existingCollectionRef = db.collection('mapCollections').doc(args.collectionId)
            let existingCollection = await existingCollectionRef.get();
            let newMapItem = {
                name: "No name specified.",
                objectInfo: [],
                pos: {x: 0, y: 0, z: 0},
                rot: {x: 0, y: 0, z: 0},
                scale: 1,
                modelPath: "",
                defaultZoom: 50,
                children: [],
                objectId: uuid.v4()
            };
            if (!existingCollection.exists) {
                res.code = "Collection Not Found";
                res.message = "There were no collections found in the database at this id. Did you make sure you used a valid id? You may need to create a collection to insert items into before creating map items.";
            } else if (existingCollection.data().owner !== "") {
                if (context.req.user) {
                    // Valid authentication.
                    let properties = Object.keys(args);
                    if (properties.includes("name")) {
                        if (args.name.trim() !== "") {
                            newMapItem.name = args.name;
                        } else {
                            res.code = "Invalid Argument";
                            res.message = "You have supplied a name that does not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid map item names.";
                            return res;
                        }
                    }
                    if (properties.includes("objectInfo")) {
                        if(args.objectInfo.every(objectProperty => objectProperty.parameter.trim() !== "" && objectProperty.value.trim() !== "")){
                            newMapItem.objectInfo = args.objectInfo.map(objectInfo=>{return {parameter:objectInfo.parameter, value:objectInfo.value}});
                        }else{
                            res.code = "Invalid Argument";
                            res.message = "One or more objectInfo properties or values do not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid map item names.";
                            return res;
                        }
                    }else{
                        args.objectInfo = []
                    }
                    if (properties.includes("pos")){
                        newMapItem.pos = {x:args.pos.x, y:args.pos.y, z:args.pos.z};
                    }
                    if (properties.includes("rot")) {
                        newMapItem.rot = {x:args.rot.x, y:args.rot.y, z:args.rot.z};
                    }
                    if (properties.includes("scale")) {
                        if (args.scale > 0) {
                            newMapItem.scale = args.scale;
                        } else {
                            res.code = "Invalid Argument";
                            res.message = "The provided scale was less than or equal to zero. Here at Atlas, we like our objects large enough to exist, so we're kindly asking you to please not.";
                            return res;
                        }
                    }
                    if (properties.includes("defaultZoom")) {
                        if (args.defaultZoom > 0) {
                            newMapItem.defaultZoom = args.defaultZoom;
                        } else {
                            res.code = "Invalid Argument";
                            res.message = "The provided default zoom was less than or equal to zero. Here at Atlas, we like to look at objects from further than *literally being in the exact same position as them* away, so kindly give a default zoom above zero.";
                            return res;
                        }
                    }
                    if (properties.includes("modelPath")) {
                        let modelPath = `MR/models/${args.modelPath}/model.glb`;
                        let file = bucket.file(modelPath);
                        let fileExists = (await file.exists())[0];
                        if(fileExists){
                            // Valid model
                            newMapItem.modelPath = args.modelPath;
                        }else{
                            res.code = "Invalid Argument";
                            res.message = "The model path you provided does not match any known object in the observable universe. Or at least, it doesn't match anything on our server.";
                            return res;
                        }
                    }
                    if (properties.includes("children")){
                        if(await args.children.every(async(childRef)=>{
                            let childCollectionRef = db.collection('mapCollections').doc(childRef.collectionId)
                            let childCollection = await childCollectionRef.get();
                            if (!childCollection.exists){
                                return false;
                            }
                            let childMapItemIds = childCollection.data().mapItems.map(mapItem => mapItem.objectId);
                            return childMapItemIds.includes(childRef.objectId);
                        })){
                            newMapItem.children = args.children.map(childRef=>{return {collectionId:childRef.collectionId, objectId:childRef.objectId}});
                        } else {
                            res.code = "Invalid Argument";
                            res.message = "One of the children provided, or the collection they are in do not exist in our database. Mysterious...";
                            return res;
                        }
                    }
                    let existingMapItems = existingCollection.data().mapItems;
                    existingMapItems.push(newMapItem);
                    let updateRes = await existingCollectionRef.update({mapItems: existingMapItems});
                    if (updateRes) {
                        res.code = "Success";
                        res.success = true;
                        res.message = "The new Map Item has been created.";
                        res.mapItem = dataFormatters.firebaseToQuery.mapItem(newMapItem, existingCollection.id, existingCollection.data().owner);
                        return res
                    }
                } else {
                    res.code = "Access Denied";
                    res.message = "You are not signed in to a valid Atlas user account. Please ensure you have used a valid and current auth token.";
                }
            } else {
                res.code = "Access Denied";
                res.message = "You cannot modify owner-less resources via the api.";
            }
            return res;
            if (context.req.user) {
                let collectionObject = {};
                collectionObject.owner = context.req.user.uid;
                if (args.name.trim() === "") {
                    res.code = "Invalid Argument";
                    res.message = "You have supplied a name that does not contain any non-whitespace characters. The query has been terminated to prevent excessively stupid collection names.";
                    return res;
                }
                collectionObject.collectionName = args.name;
                collectionObject.visibility = "Private";
                collectionObject.mapItems = [];
                const docRef = await db.collection('mapCollections').add(collectionObject);
                const doc = await docRef.get();
                let data = doc.data();
                res.collection = dataFormatters.firebaseToQuery.collection(data, doc.id);
                res.code = "Success";
                res.success = true;
                res.message = "The collection has been created.";
            } else {
                res.code = "Access Denied";
                res.message = "You must be signed in to create a collection.";
            }
            return res
        },
        deleteMapItem: async (parent, args, context, info) => {
            let res = {
                code: "Unspecified Failure",
                success: false,
                message: "The mutation resolver completed the request without modifying the response. This should never happen. Please contact BenCo or another lead developer!",
                collection: null
            }
            if (context.req.user) {
                let existingCollectionRef = db.collection('mapCollections').doc(args.objectRef.collectionId)
                let existingCollection = await existingCollectionRef.get();
                if (!existingCollection.exists) {
                    res.code = "Collection Not Found";
                    res.message = "There were no collections found in the database at this id. Did you make sure you used a valid id?";
                    return res;
                } else if (existingCollection.data().owner !== "") {
                    if (existingCollection.data().owner === context.req.user.uid) {
                        // Correct user
                        let existingMapItems = existingCollection.data().mapItems;
                        if (!existingMapItems.some(mapItem=>mapItem.objectId === args.objectRef.objectId)){
                            res.code = "Map Item Not Found";
                            res.message = "There were no map items found in the collection at this id. Did you make sure you used a valid id?";
                            return res;
                        }
                        existingMapItems = existingMapItems.filter(mapItem => mapItem.objectId !== args.objectRef.objectId);
                        let deleteRes = await existingCollectionRef.update({mapItems: existingMapItems});
                        if (deleteRes) {
                            res.code = "Success";
                            res.success = true;
                            res.message = "The Map Item has been deleted.";
                            res.mapItem = null;
                            return res
                        } else {
                            res.code = "Null Response";
                            res.success = false;
                            res.message = "The database returned a null response. The map item may have still been deleted successfully, but you should attempt to retrieve it to verify this.";
                        }
                    } else {
                        res.code = "Access Denied";
                        res.message = "You cannot delete from a collection that is owned by someone else.";
                    }
                } else {
                    res.code = "Access Denied";
                    res.message = "You cannot delete owner-less resources via the api.";
                }
            } else {
                res.code = "Access Denied";
                res.message = "You must be signed in to delete a collection.";
            }
            return res
        }
    }
}


process.env.APOLLO_KEY = functions.config().atlas.apollo_key;

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req, res}) => ({
        headers: req.headers,
        req,
        res,
    }),
    engine: {
        reportSchema: true,
        variant: "current"
    },
    playground: false,
    introspection: true,
});

let handler = server.createHandler({
    cors: {
        origin: '*',
        credentials: true,
    },
});

const authenticate = async (req, res, next) => {
    // Assume user is not logged in to begin with.
    req.user = null;
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        // Unauthorized request. Proceed anonymously.
        next(req, res);
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    admin.auth().verifyIdToken(idToken)
        .then(decodedIdToken => {
            req.user = decodedIdToken;
            next(req, res)
        })
        .catch((e) => {
            res.status(401).send(`Authentication error: ${e.code} (${e.message}).`)
        });
};

exports.api = functions.https.onRequest((req, res) => {
    authenticate(req, res, handler)
        .catch(err => console.error(err));
});

/**
 * Redirects the User to the Discord authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.https.onRequest(async (req, res) => {
    const config = {
        client: {
            id: oAuthConfig.clientID,
            secret: oAuthConfig.clientSecret,
        },
        auth: {
            tokenHost: 'https://discord.com',
            tokenPath: '/api/oauth2/token',
            authorizePath: '/api/oauth2/authorize',
            revokePath: '/api/oauth2/token/revoke'
        },
    };
    const {AuthorizationCode} = require('simple-oauth2');
    const client = new AuthorizationCode(config);

    cookieParser()(req, res, () => {
        const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
        console.log('Setting verification state:', state);
        res.cookie('state', state.toString(), {
            maxAge: 3600000,
            secure: true,
            httpOnly: true,
            sameSite: "none"
        });
        const redirectUri = client.authorizeURL({
            redirect_uri: oAuthConfig.redirectUri,
            scope: oAuthConfig.scopes.join(' '),
            state: state,
        });
        console.log('Redirecting to:', redirectUri);
        res.redirect(redirectUri);
    });
});

/**
 * Exchanges a given Discord auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token, display name, photo URL and Discord access token are sent back in a JSONP callback
 * function with function name defined by the 'callback' query parameter.
 */
exports.token = functions.https.onRequest(async (req, res) => {
    const config = {
        client: {
            id: oAuthConfig.clientID,
            secret: oAuthConfig.clientSecret,
        },
        auth: {
            tokenHost: 'https://discord.com',
            tokenPath: '/api/oauth2/token',
            authorizePath: '/api/oauth2/authorize',
            revokePath: '/api/oauth2/token/revoke'
        },
    };
    const {AuthorizationCode} = require('simple-oauth2');
    const client = new AuthorizationCode(config);

    try {
        return cookieParser()(req, res, async () => {
            console.log('Received verification state:', req.cookies.state);
            console.log('Received state:', req.query.state);
            if (!req.cookies.state) {
                throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
            } else if (req.cookies.state !== req.query.state) {
                throw new Error('State validation failed');
            }
            console.log('Received auth code:', req.query.code);
            const results = await client.getToken({
                code: req.query.code,
                redirect_uri: oAuthConfig.redirectUri,
            });
            console.log('Auth code exchange result received:', results);

            const accessToken = results.token.access_token;
            const tokenType = results.token.token_type;

            let response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${tokenType} ${accessToken}`,
                },
            });

            let user = await response.json();

            // We have a Discord access token and the user identity now.
            const discordUserID = user.id;
            const email = user.email;
            const profilePic = `https://cdn.discordapp.com/avatars/${discordUserID}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}`;
            const userName = user.username;

            // Create a Firebase account and get the Custom Auth Token.
            const firebaseToken = await createFirebaseAccount(discordUserID, email, userName, profilePic, accessToken);
            // Serve an HTML page that signs the user in and updates the user profile.
            return res.jsonp({token: firebaseToken});
        });
    } catch (error) {
        return res.jsonp({
            error: error.toString(),
        });
    }
});

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(discordID, email, displayName, photoURL, accessToken) {
    // The UID we'll assign to the user.
    const uid = `discord:${discordID}`;

    // Create or update the user account.
    const userCreationTask = admin.auth().updateUser(uid, {
        displayName: displayName,
        email: email,
        photoURL: photoURL,
    }).catch((error) => {
        // If user does not exists we create it.
        if (error.code === 'auth/user-not-found') {
            return admin.auth().createUser({
                uid: uid,
                displayName: displayName,
                email: email,
                photoURL: photoURL,
            });
        }
        throw error;
    });

    // Wait for all async task to complete then generate and return a custom auth token.
    await Promise.all([userCreationTask]);
    // Create a Firebase custom auth token.
    const token = await admin.auth().createCustomToken(uid);
    console.log('Created Custom token for UID "', uid, '" Token:', token);
    return token;
}