/********* Utility methods ****************/
const PUBLIC_KEY = 'MIIBI....B';
const PRIVATE_KEY = 'MIIBI....P';
const md5 = (val) => {
    return md5Encrypt(val).toString();
}
const authorize = data => {
    return axios.post({
        url: '/brms/api/v1.0/accounts/authorize',
        data
    });
};
const keepalive = data => {
    return axios.put({
        url: '/brms/api/v1.0/accounts/keepalive',
        data
    });
};
const updateToken = data => {
    return axios.post({
        url: '/brms/api/v1.0/accounts/updateToken',
        data
    });
};
/**
* setItem
* The function to cache data locally
* @param {*} key
* @param {*} data
*/
function setItem(key, data) {
    localStorage.setItem(key, data);
}
/********* Utility methods END ************/
/********************************************************
* !! MAIN PART BEGIN !! *
********************************************************/
/**
* firstLogin
* First Login. Get information about encryption
*
* @param {*} username
* @return {*}
* @memberof Session
*/
async function firstLogin(username) {
    try {
        await api.authorize({
            userName: username,
            ipAddress: '',
            clientType: CLIENT_TYPE,
        });
    } catch ({ realm, encryptType, publickey, randomKey }) {
        return { realm, encryptType, publickey, randomKey };
    }
}
/**
* login (main)
*
* @param {*} username
* @param {*} password
* @return {*} undefined | Promise
* When some error occurs, a Rejected promise is thrown to the outer layer
* @memberof Session
*/
async function login(username, password) {
    try {
        /*********************************************
        * do first login *
        *********************************************/
        const firsetLoginResult = await firstLogin(username);
        const { realm, encryptType, publickey, randomKey } = firsetLoginResult;
        /*********************************************
        * md5 encrypt *
        *********************************************/
        const $$signature = md5(
            username + ':' + realm + ':' + md5(md5(username + md5(password))),
        );
        const signature = md5($$signature + ':' + randomKey);
        // Cache publickey
        setItem('firstRejectPublicKey', publickey);
        setItem('$$signature', $$signature);
        /*********************************************
        * do second login *
        *********************************************/
        const {
            code,
            desc,
            data,
            token,
            secretKey,
            secretVector,
        } = await api.authorize({
            mac: '',
            signature,
            userName: username,
            randomKey,
            /**
            * ---------------Please using self-maintained publickey---------------
            * Atteniton: Do not use the publickKey given by server.
            * It's not the same thing
            * ---------------Please using self-maintained publickey---------------
            */
            publicKey: PUBLIC_KEY,
            encryptType,
            ipAddress: '',
            clientType: 'WINPC_V2',
            userType,
        });
        /*********************************************
        * handle result *
        *********************************************/
        if (code && code !== 1000) {
            // If code is not equal to 1000
            return await Promise.reject({ code, data, desc });
        } else if (token) {
            // If there is a token and the code is equal to 1000
            // Login succeeded
            // Cache data locally
            // You may use this data afer logining
            setItem('token', token); // token
            setItem('secretKey', secretKey); // secretKey
            setItem('secretVector', secretVector); // secretVector
        }
    } catch ({ code, data, desc }) {
        // Other kinds of exception handling
        return await Promise.reject({ code, data, desc });
    }
}
/**
* keep alive
*/
async function doKeepAlive() {
    const token = getItem('token');
    keepalive({
        token
    });
};
/**
* UpdateToken
*/
async function doUpdateToken() {
    const $$signature = getItem('$$signature');
    const token = getItem('token');
    const signature = md5($$signature + ':' + token);
    const { token: updatedToken } = await updateToken({ signature });
    setItem('token', updatedToken);
}
/********* Call login function ************/
const username = 'admin';
const password = 'admin1234567';
login(username, password);
/********* Call login function ************/
/*********** Keepalive and update ************/
const KEEP_ALIVE_TIME = 22 * 1000;
const RESET_TOKEN_TIME = 22 * 60 * 1000;
setInterval(async () => {
    await doKeepAlive()
}, KEEP_ALIVE_TIME);
setInterval(async () => {
    await doUpdateToken();
}, RESET_TOKEN_TIME);
/********* Keepalive and update END **********/