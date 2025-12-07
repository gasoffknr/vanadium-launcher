/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { database, changePanel, addAccount, accountSelect } from '../utils.js';
const { ipcRenderer } = require('electron');

class Login {
    static id = "login";
    async init(config) {
        this.config = config
        this.database = await new database().init();
        if (this.config.online) this.getOnline()
        else this.getOffline()
    }

    getOnline() {
        console.log(`Initializing Microsoft Panel...`)
        this.loginMicrosoft();
        document.querySelector('.cancel-login').addEventListener("click", () => {
            document.querySelector(".cancel-login").style.display = "none";
            changePanel("settings");
        })
    }

    getOffline() {
        console.log(`Initializing Microsoft Panel...`)
        console.log(`Initializing Offline Panel...`)
        this.loginMicrosoft();
        this.loginOffline();
        document.querySelector('.cancel-login').addEventListener("click", () => {
            document.querySelector(".cancel-login").style.display = "none";
            changePanel("settings");
        })
    }

    loginMicrosoft() {
        let microsoftBtn = document.querySelector('.microsoft')
        let cancelBtn = document.querySelector('.cancel-login')

        microsoftBtn.addEventListener("click", () => {
            microsoftBtn.disabled = true;
            cancelBtn.disabled = true;
            ipcRenderer.invoke('Microsoft-window', this.config.client_id).then(account_connect => {
                if (!account_connect) {
                    microsoftBtn.disabled = false;
                    cancelBtn.disabled = false;
                    return;
                }

                let account = {
                    access_token: account_connect.access_token,
                    client_token: account_connect.client_token,
                    uuid: account_connect.uuid,
                    name: account_connect.name,
                    refresh_token: account_connect.refresh_token,
                    user_properties: account_connect.user_properties,
                    meta: {
                        type: account_connect.meta.type,
                        xuid: account_connect.meta.xuid,
                        demo: account_connect.meta.demo
                    }
                }

                let profile = {
                    uuid: account_connect.uuid,
                    skins: account_connect.profile.skins || [],
                    capes: account_connect.profile.capes || []
                }

                this.database.add(account, 'accounts')
                this.database.add(profile, 'profile')
                this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

                addAccount(account)
                accountSelect(account.uuid)
                changePanel("home");

                microsoftBtn.disabled = false;
                cancelBtn.disabled = false;
                cancelBtn.style.display = "none";
            }).catch(err => {
                console.log(err)
                microsoftBtn.disabled = false;
                cancelBtn.disabled = false;
            });
        })
    }

    async loginOffline() {
        let usernameInput = document.querySelector('.Mail')
        let infoLogin = document.querySelector('.info-login')
        let loginBtn = document.querySelector(".login-btn")
        let cancelBtn = document.querySelector('.cancel-login')

        loginBtn.addEventListener("click", async () => {
            loginBtn.disabled = true;
            usernameInput.disabled = true;
            cancelBtn.disabled = true;
            infoLogin.innerHTML = "Connexion en cours...";

            if (usernameInput.value == "") {
                infoLogin.innerHTML = "Entrez votre nom d'utilisateur"
                loginBtn.disabled = false;
                usernameInput.disabled = false;
                cancelBtn.disabled = false;
                return
            }

            if (usernameInput.value.length < 3) {
                infoLogin.innerHTML = "Votre nom d'utilisateur doit avoir au moins 3 caractères"
                loginBtn.disabled = false;
                usernameInput.disabled = false;
                cancelBtn.disabled = false;
                return
            }

            // Création du compte offline
            let account = {
                access_token: null,
                client_token: null,
                uuid: this.generateOfflineUUID(usernameInput.value),
                name: usernameInput.value,
                user_properties: '{}',
                meta: {
                    type: 'offline',
                    offline: true
                }
            }

            this.database.add(account, 'accounts')
            this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

            addAccount(account)
            accountSelect(account.uuid)
            changePanel("home");

            usernameInput.value = "";
            loginBtn.disabled = false;
            usernameInput.disabled = false;
            cancelBtn.disabled = false;
            cancelBtn.style.display = "none";
            infoLogin.innerHTML = "&nbsp;";
        })
    }

    generateOfflineUUID(username) {
        // Génère un UUID offline basé sur le nom d'utilisateur
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update('OfflinePlayer:' + username).digest();
        hash[6] = (hash[6] & 0x0f) | 0x30;
        hash[8] = (hash[8] & 0x3f) | 0x80;
        const hex = hash.toString('hex');
        return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
    }
}

export default Login;