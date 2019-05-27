"use strict";

const Base = require("./Base");
const Permission = require("./Permission");
const Permissions = require("../Constants").Permissions;
const User = require("./User");
const VoiceState = require("./VoiceState");

/**
* Represents a server member
* @prop {String} id The ID of the member
* @prop {String} mention A string that mentions the member
* @prop {Guild} guild The guild the member is in
* @prop {Number} joinedAt Timestamp of when the member joined the guild
* @prop {String} status The member's status. Either "online", "idle", "dnd", or "offline"
* @prop {Object?} game The active game the member is playing
* @prop {String} game.name The name of the active game
* @prop {Object} clientStatus The member's per-client status
* @prop {String} clientStatus.web The member's status on web. Either "online", "idle", "dnd", or "offline". Will be "online" for bots
* @prop {String} clientStatus.desktop The member's status on desktop. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
* @prop {String} clientStatus.mobile The member's status on mobile. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
* @prop {Object[]} activities The member's current activities
* @prop {Number} game.type The type of the active game (0 is default, 1 is Twitch, 2 is YouTube)
* @prop {String?} game.url The url of the active game
* @prop {VoiceState} voiceState The voice state of the member
* @prop {String?} nick The server nickname of the member
* @prop {String[]} roles An array of role IDs this member is a part of
* @prop {User} user The user object of the member
* @prop {Permission} permission The guild-wide permissions of the member
* @prop {String} defaultAvatar The hash for the default avatar of a user if there is no avatar set
* @prop {Number} createdAt Timestamp of user creation
* @prop {Boolean} bot Whether the user is an OAuth bot or not
* @prop {String} username The username of the user
* @prop {String} discriminator The discriminator of the user
* @prop {String?} avatar The hash of the user's avatar, or null if no avatar
* @prop {String} defaultAvatarURL The URL of the user's default avatar
* @prop {String} avatarURL The URL of the user's avatar which can be either a JPG or GIF
* @prop {String} staticAvatarURL The URL of the user's avatar (always a JPG)
*/
class Member extends Base {
    constructor(data, guild, client) {
        super(data.id);
        if((this.guild = guild)) {
            this.user = guild.shard.client.users.get(data.id);
            if(!this.user && data.user) {
                this.user = guild.shard.client.users.add(data.user, guild.shard.client);
            }
            if(!this.user) {
                throw new Error("User associated with Member not found: " + data.id);
            }
        } else if(data.user) {
            this.user = new User(data.user, client);
        } else {
            this.user = null;
        }
        this.voiceState = new VoiceState(data);
        this.update(data);
    }

    update(data) {
        this.status = data.status !== undefined ? data.status : this.status || "offline";
        this.game = data.game !== undefined ? data.game : this.game || null;
        this.joinedAt = data.joined_at !== undefined ? Date.parse(data.joined_at) : this.joinedAt;
        this.clientStatus = data.client_status !== undefined ? Object.assign({ web: "offline", desktop: "offline", mobile: "offline" }, data.client_status) : this.clientStatus;
        this.activities = data.activities;

        if(data.mute !== undefined) {
            this.voiceState.update(data);
        }

        this.nick = data.nick !== undefined ? data.nick : this.nick || null;
        if(data.roles !== undefined) {
            this.roles = data.roles;
        }
    }

    get permission() {
        if(this.id === this.guild.ownerID) {
            return new Permission(Permissions.all);
        } else {
            let permissions = this.guild.roles.get(this.guild.id).permissions.allow;
            for(let role of this.roles) {
                role = this.guild.roles.get(role);
                if(!role) {
                    continue;
                }

                const {allow: perm} = role.permissions;
                if(perm & Permissions.administrator) {
                    permissions = Permissions.all;
                    break;
                } else {
                    permissions |= perm;
                }
            }
            return new Permission(permissions);
        }
    }

    get username() {
        return this.user.username;
    }

    get discriminator() {
        return this.user.discriminator;
    }

    get avatar() {
        return this.user.avatar;
    }

    get bot() {
        return this.user.bot;
    }

    get createdAt() {
        return this.user.createdAt;
    }

    get defaultAvatar() {
        return this.user.defaultAvatar;
    }

    get defaultAvatarURL() {
        return this.user.defaultAvatarURL;
    }

    get staticAvatarURL(){
        return this.user.staticAvatarURL;
    }

    get avatarURL() {
        return this.user.avatarURL;
    }

    get mention() {
        return `<@!${this.id}>`;
    }

    get tag() {
        return `${this.username}#${this.discriminator}`;
    }

    /**
    * Edit the guild member
    * @param {Object} options The properties to edit
    * @param {String[]} [options.roles] The array of role IDs the user should have
    * @param {String} [options.nick] Set the user's server nickname, "" to remove
    * @param {Boolean} [options.mute] Server mute the user
    * @param {Boolean} [options.deaf] Server deafen the user
    * @param {String} [options.channelID] The ID of the voice channel to move the user to (must be in voice)
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    edit(options, reason) {
        return this.guild.shard.client.editGuildMember.call(this.guild.shard.client, this.guild.id, this.id, options, reason);
    }

    /**
    * Add a role to the guild member
    * @param {String} roleID The ID of the role
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    addRole(roleID, reason) {
        return this.guild.shard.client.addGuildMemberRole.call(this.guild.shard.client, this.guild.id, this.id, roleID, reason);
    }

    /**
    * Remve a role from the guild member
    * @param {String} roleID The ID of the role
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    removeRole(roleID, reason) {
        return this.guild.shard.client.removeGuildMemberRole.call(this.guild.shard.client, this.guild.id, this.id, roleID, reason);
    }

    /**
    * Kick the member from the guild
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    kick(reason) {
        return this.guild.shard.client.kickGuildMember.call(this.guild.shard.client, this.guild.id, this.id, reason);
    }

    /**
    * Ban the user from the guild
    * @param {Number} [deleteMessageDays=0] Number of days to delete messages for
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    ban(deleteMessageDays, reason) {
        return this.guild.shard.client.banGuildMember.call(this.guild.shard.client, this.guild.id, this.id, deleteMessageDays, reason);
    }

    /**
    * Unban the user from the guild
    * @param {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    unban(reason) {
        return this.guild.shard.client.unbanGuildMember.call(this.guild.shard.client, this.guild.id, this.id, reason);
    }

    /**
     * Disconnects the user from the voice channel they are in
     * @param {Boolean} [bypassCheck=false] Defaults to `false`, whether to bypass checking if the user is in a VC (if `false` and the user is not in a VC, the attempt to disconnect them will be aborted)
     * @returns {Promise} 
     */
    disconnect (bypassCheck = false) {
        if (!bypassCheck && (!this.voiceState || !this.voiceState.channelID)) {
            return;
        }
        return this.guild.shard.client.disconnectGuildMember.call(this.guild.shard.client, this.guild.id, this.id);
    }

    toJSON() {
        const base = super.toJSON(true);
        for(const prop of ["game", "joinedAt", "nick", "roles", "status", "user", "voiceState"]) {
            if(this[prop] !== undefined) {
                base[prop] = this[prop] && this[prop].toJSON ? this[prop].toJSON() : this[prop];
            }
        }
        return base;
    }
}

module.exports = Member;
