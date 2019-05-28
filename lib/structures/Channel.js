"use strict";

const Base = require("./Base");
const channelTypes = require('../Constants').channelTypes;

/**
* Represents a channel. You also probably want to look at CategoryChannel, PrivateChannel, TextChannel, NewsChannel, and VoiceChannel.
* @prop {String} id The ID of the channel
* @prop {String} mention A string that mentions the channel
* @prop {Number} type The type of the channel
* @prop {Number} createdAt Timestamp of the channel's creation
*/
class Channel extends Base {
    constructor(data) {
        super(data.id);
        /** @type {Number} The channel's type, as specified by DAPI */
        this.type = data.type;
    }

    get mention() {
        return `<#${this.id}>`;
    }

    /**
     * Checks whether this channel is of the given type
     * @param {String|Number} type The type to check this channel's type against, can be either the raw discord types number or their string equivalent (such as `GUILD_TEXT`)
     * @returns {Boolean} Whether this channel is of the given type
     */
    isType(type) {
        if ((typeof type !== "string" && typeof type !== "number") || (typeof type === "number" && Number.isNaN(type))) {
            throw new Error(`Expected parameter "type" to be of either type "string" or type "number", received type "${typeof type === 'number' ? 'NaN' : typeof type}"`);
        }
        for (const key in channelTypes) {
            if (type === key || type === channelTypes[key].API_TYPE || type === channelTypes[key].FRIENDLY_TYPE) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets the human-readable type of the channel, fully lower-cased
     * @readonly
     * @memberof Channel
     * @type {String} The human-readable type
     */
    get friendlyType() {
        for (const key in channelTypes) {
            if (channelTypes[key].API_TYPE === this.type) {
                return channelTypes[key].FRIENDLY_TYPE;
            }
        }
        return 'unknown channel type';
    }

    toJSON() {
        const base = super.toJSON(true);
        for(const prop of ["type"]) {
            if(this[prop] !== undefined) {
                base[prop] = this[prop] && this[prop].toJSON ? this[prop].toJSON() : this[prop];
            }
        }
        return base;
    }
}

module.exports = Channel;
