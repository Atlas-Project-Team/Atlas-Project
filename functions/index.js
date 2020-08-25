const functions = require('firebase-functions');
const cookieParser = require('cookie-parser');
const crypto = require("crypto");
const admin = require('firebase-admin');
const {error} = require("firebase-functions/lib/logger");
const serviceAccount = require('./service-account.json');
const {oAuthConfig} = require('./info');
const fetch = require('node-fetch');
const {ApolloServer, gql} = require('apollo-server-cloud-functions');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const typeDefs = gql`
    type Query {
        getCollections: [MapCollection!]!,
        getMapData: [MapItem!]!,
        getUserName(uid: ID): String
    }

    type MapItem {
        children: [ID!]!,
        defaultZoom: Float!,
        modelPath: String!,
        name: String!,
        objectInfo: [ObjectParameter]!,
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
        visibility: String
    }

    type ObjectParameter {
        parameter: String!,
        value: String!
    }

    type Vector3 {
        x: Float,
        y: Float,
        z: Float
    }
`;

const resolvers = {
    Query: {
        getCollections: async (parent, args, context, info) => {
            let collections = [];
            let querySnapshot = await db.collection("mapCollections").where("owner", "in", (context.req.user ? ['', context.req.user.uid] : [''])).get()
            querySnapshot.forEach((doc) => {
                let data = doc.data();
                data.name = data.collectionName;
                data.mapItems.map((mapItem, index) => {
                    mapItem.objectId = `${doc.id}.${index}`;
                    mapItem.collection = doc.id;
                    mapItem.owner = data.owner;
                });
                collections.push(data);
            });
            return collections;
        },
        getMapData: async (parent, args, context, info) => {
            let mapData = [];
            let querySnapshot = await db.collection("mapCollections").where("owner", "in", (context.req.user ? ['', context.req.user.uid] : [''])).get()
            querySnapshot.forEach((doc) => {
                let data = doc.data();
                data.mapItems.map((mapItem, index) => {
                    mapItem.objectId = `${doc.id}.${index}`;
                    mapItem.collection = doc.id;
                    mapItem.owner = data.owner;
                });
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
            console.log("Authentication failure. Proceeding with anonymous request.");
            next(req, res);
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