import * as os from "os";
import keytar from "keytar";
import {jwtDecode} from "jwt-decode";
import url from "url";
import {shell} from "electron";
import {ServerConfig} from "../background";

class AuthHandler{
    keytarService = 'nt-openid-oauth';
    keytarAccount = os.userInfo().username;

    accessToken: string | null = null;
    profile: {} = null;
    refreshToken: string | null = null;
    e: number = 0

    async getRefreshToken(){
        const refreshToken = await keytar.getPassword(this.keytarService, this.keytarAccount);
    }

    async refreshLogin(config: ServerConfig){
        //TODO
    }

    doFreshLogin(config: ServerConfig){
        shell.openExternal(config.login_entry)
    }

    async save(callbackURL: string){
        const urlParts = url.parse(callbackURL, true);
        const query = urlParts.query;
        this.accessToken = query.token as string;
        this.profile = jwtDecode(query.token as string);
        this.refreshToken = query.refresh as string;
        this.e = parseInt(query.e as string)

        if (this.refreshToken) {
            await keytar.setPassword(this.keytarService, this.keytarAccount, this.refreshToken);
        }
    }

    async logout() {
        await keytar.deletePassword(this.keytarService, this.keytarAccount);
        this.accessToken = null;
        this.profile = null;
        this.refreshToken = null;
    }
}

const authHandler = new AuthHandler()
export {
    authHandler
}