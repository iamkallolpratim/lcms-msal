import config from '../config';
import { UserAgentApplication } from 'msal';
import { getUserDetails } from './GraphService';



const userAgentApplication = new UserAgentApplication({
    auth: {
        clientId: config.appId
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    }
});

export const userDetails = userAgentApplication.getAccount();

export const authService = {

    login: async function () {
        try {
            await userAgentApplication.loginPopup(
                {
                    scopes: config.scopes,
                    prompt: "select_account"
                });
            await this.getUserProfile();
        }
        catch (err) {
            var errParts = err.split('|');
            return errParts;
        }

    },

    logout: function () {
        userAgentApplication.logout();
    },
    getAccount: function () {
        return userAgentApplication.getAccount()
    },
    getUserProfile: async function () {
        try {
            var accessToken = await userAgentApplication.acquireTokenSilent({
                scopes: config.scopes
            });

            if (accessToken) {
                var user = await getUserDetails(accessToken);
                return user;
            }
        }
        catch (err) {
            var error = {};
            if (typeof (err) === 'string') {
                var errParts = err.split('|');
                error = errParts.length > 1 ?
                    { message: errParts[1], debug: errParts[0] } :
                    { message: err };
            } else {
                error = {
                    message: err.message,
                    debug: JSON.stringify(err)
                };
            }

            return error;
        }

    }

};