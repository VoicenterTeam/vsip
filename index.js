import JsSIP from 'jssip';
import {forEach} from 'p-iteration';

/**
 * @typedef {Object} VSIPOptions
 * @property {Object} store - Vuex store
 */

/**
 * @typedef {Object} RoomInfo
 * @property {Date} started
 * @property {Number} roomId
 */

/**
 * @typedef {Object} RoomList
 * @property {RoomInfo} roomId
 */

/**
 * TODO:
 * 1. List of input/output devices
 * 2. Set currently used input/output device
 */

let UA;

const LISTENER_TYPE = {
    NEW_CALL: 'new_call',
    CALL_CONFIRMED: 'confirmed',
    CALL_FAILED: 'failed',
    CALL_PROGRESS: 'progress',
    CALL_ENDED: 'ended'
}

function simplifyCallObject(call) {
    const keysToInclude = ['roomId', '_audioMuted', '_cancel_reason', '_contact', 'direction', '_end_time', '_eventsCount', '_from_tag', '_id', '_is_canceled', '_is_confirmed', '_late_sdp', '_localHold', '_videoMuted', 'status', 'start_time', '_remote_identity'];

    let simplified = {};

    keysToInclude.forEach(key => {
        if (call[key] !== undefined) {
            simplified[key] = call[key]
        }
    })

    return simplified
}

function getNewRoomId(activeRooms) {
    const roomIdList = Object.keys(activeRooms);

    if (roomIdList.length === 0) {
        return 1;
    }

    return (parseInt(roomIdList.sort()[roomIdList.length - 1]) + 1);
}

let activeCalls = {};

/**
 * @param {VSIPOptions} options
 */
function initStoreModule(options) {
    if (!options || !options.store) {
        throw new Error('Please initialise plugin with a Vuex store.');
    }

    const types = {
        SET_MEDIA_DEVICES: 'SET_MEDIA_DEVICES',
        SET_UA_INIT: 'SET_UA_INIT',
        SET_SELECTED_INPUT_DEVICE: 'SET_SELECTED_INPUT_DEVICE',
        ADD_CALL: 'ADD_CALL',
        ADD_ROOM: 'ADD_ROOM',
        SET_CURRENT_ACTIVE_ROOM_ID: 'SET_CURRENT_ACTIVE_ROOM_ID',
        REMOVE_ROOM: 'REMOVE_ROOM',
        REMOVE_CALL: 'REMOVE_CALL',
        SET_SIP_DOMAIN: 'SET_SIP_DOMAIN',
        SET_SIP_OPTIONS: 'SET_SIP_OPTIONS',
        SET_SELECTED_OUTPUT_DEVICE: 'SET_SELECTED_OUTPUT_DEVICE',
        UPDATE_CALL: 'UPDATE_CALL',
        ADD_LISTENER: 'ADD_LISTENER',
        REMOVE_LISTENER: 'REMOVE_LISTENER',
    };

    options.store.registerModule('vsip', {
        namespaced: true,
        state: {
            activeCalls: {},
            /** @type RoomList */
            activeRooms: {},
            availableMediaDevices: [],
            selectedMediaDevices: {
                input: localStorage.getItem('selectedInputDevice') || 'default',
                output: localStorage.getItem('selectedOutputDevice') || 'default'
            },
            currentActiveRoomId: null,
            uaInit: false,
            sipDomain: '',
            sipOptions: {},
            listeners: {}
        },
        mutations: {
            [types.ADD_LISTENER]: (state, {type, listener}) => {
                state.listeners = {
                    ...state.listeners,
                    [type]: listener
                }
            },
            [types.REMOVE_LISTENER]: (state, value) => {
                const listenersCopy = {...state.listeners};
                delete listenersCopy[value];

                state.listeners = {
                    ...listenersCopy,
                }
            },
            [types.SET_MEDIA_DEVICES]: (state, value) => {
                state.availableMediaDevices = value;
            },
            [types.SET_UA_INIT]: (state) => {
                state.uaInit = true
            },
            [types.SET_SELECTED_INPUT_DEVICE]: (state, value) => {
                localStorage.setItem('selectedInputDevice', value);

                state.selectedMediaDevices.input = value;
            },
            [types.SET_SELECTED_OUTPUT_DEVICE]: (state, value) => {
                localStorage.setItem('selectedOutputDevice', value);

                state.selectedMediaDevices.output = value;
            },
            [types.UPDATE_CALL]: (state, value) => {
                state.activeCalls = {
                    ...state.activeCalls,
                    [value._id]: simplifyCallObject(value)
                }
            },
            [types.ADD_CALL]: (state, value) => {
                state.activeCalls = {
                    ...state.activeCalls,
                    [value._id]: simplifyCallObject(value)
                }

                activeCalls[value._id] = value
            },
            [types.REMOVE_CALL]: (state, value) => {
                const stateActiveCallsCopy = {...state.activeCalls};
                delete stateActiveCallsCopy[value];

                delete activeCalls[value];
                state.activeCalls = {
                    ...stateActiveCallsCopy,
                }
            },
            /**
             * @param state
             * @param {RoomInfo} value
             */
            [types.ADD_ROOM]: (state, value) => {
                state.activeRooms = {
                    ...state.activeRooms,
                    [value.roomId]: value
                }
            },
            [types.REMOVE_ROOM]: (state, value) => {
                const activeRoomsCopy = {...state.activeRooms};
                delete activeRoomsCopy[value];

                state.activeRooms = {
                    ...activeRoomsCopy,
                }
            },
            [types.SET_CURRENT_ACTIVE_ROOM_ID]: (state, value) => {
                state.currentActiveRoomId = value;
            },
            [types.SET_SIP_DOMAIN]: (state, value) => {
                state.sipDomain = value
            },
            [types.SET_SIP_OPTIONS]: (state, value) => {
                state.sipOptions = value
            }
        },
        getters: {
            getActiveRooms: (state) => state.activeRooms,
            getActiveCalls: (state) => state.activeCalls,
            _uaInit: (state) => state.uaInit,
            getSipDomain: (state) => state.sipDomain,
            getSipOptions: (state, getters) => {
                return {
                    ...state.sipOptions,
                    mediaConstraints: getters.getUserMediaConstraints,
                }
            },
            getInputDeviceList: (state) => {
                return state.availableMediaDevices.filter(device => device.kind === 'audioinput');
            },
            getOutputDeviceList: (state) => {
                return state.availableMediaDevices.filter(device => device.kind === 'audiooutput');
            },
            getCurrentActiveRoomId: (state) => {
                return state.currentActiveRoomId;
            },
            getSelectedInputDevice: (state) => state.selectedMediaDevices.input,
            getSelectedOutputDevice: (state) => state.selectedMediaDevices.output,
            getUserMediaConstraints: (state) => {
                return {
                    audio: {
                        deviceId: {
                            exact: state.selectedMediaDevices.input
                        }
                    },
                    video: false
                }
            },
            getListeners: (state) => {
                return state.listeners
            }
        },
        actions: {
            async _addCall({commit, getters, dispatch}, session) {
                if (Object.keys(getters.getActiveCalls).find(activeSession => activeSession._id === session._id) !== undefined) {
                    return;
                }

                const roomId = getNewRoomId(getters.getActiveRooms);
                const newRoomInfo = {
                    started: new Date(),
                    roomId
                };

                session.roomId = roomId;
                commit(types.ADD_CALL, session);
                commit(types.ADD_ROOM, newRoomInfo);

                await dispatch('setCurrentActiveRoom', roomId);
            },
            _activeCallListRemove({commit, dispatch}, {_id}) {
                const callRoomIdToConfigure = activeCalls[_id].roomId;
                commit(types.REMOVE_CALL, _id);

                dispatch('_roomReconfigure', callRoomIdToConfigure);
            },
            _deleteRoomIfEmpty({commit, getters}, roomId) {
                if (Object.values(activeCalls).filter(call => call.roomId === roomId).length === 0) {
                    commit(types.REMOVE_ROOM, roomId)

                    if (getters.getCurrentActiveRoomId === roomId) {
                        commit(types.SET_CURRENT_ACTIVE_ROOM_ID, roomId);
                    }
                }
            },
            async _roomReconfigure({commit, getters, dispatch}, roomId) {
                if (!roomId) {
                    return;
                }

                const callsInRoom = Object.values(activeCalls).filter(call => call.roomId === roomId);

                // Lets take care on the audio output first and check if passed room is our selected room
                if (getters.getCurrentActiveRoomId === roomId) {
                    callsInRoom.forEach(call => {
                        if (call.audioTag) {
                            call.audioTag.muted = false;
                            commit(types.UPDATE_CALL, call);
                        }
                    })
                } else {
                    callsInRoom.forEach(call => {
                        call.audioTag.muted = true;
                        commit(types.UPDATE_CALL, call);
                    });
                }

                // Now lets configure the sound we are sending for each active call on this room
                if (callsInRoom.length === 0) {
                    dispatch('_deleteRoomIfEmpty', roomId);
                } else if (callsInRoom.length === 1 && getters.getCurrentActiveRoomId !== roomId) {
                    if (!callsInRoom[0]._localHold) {
                        dispatch('doCallHold', {callId: callsInRoom[0]._id, toHold: true})
                    }
                } else if (callsInRoom.length === 1 && getters.getCurrentActiveRoomId === roomId) {
                    if (callsInRoom[0]._localHold) {
                        dispatch('doCallHold', {callId: callsInRoom[0]._id, toHold: false})
                    }

                    let stream;

                    try {
                        stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                    } catch (err) {
                        console.error(err)
                    }
                    if (callsInRoom[0].connection && callsInRoom[0].connection.getSenders()[0]) {
                        await callsInRoom[0].connection.getSenders()[0].replaceTrack(stream.getTracks()[0]);
                    }
                } else if (callsInRoom.length > 1) {
                    await dispatch('_doConference', callsInRoom);
                }
            },
            async _doConference({dispatch, getters}, sessions) {
                sessions.forEach(call => {
                    if (call._localHold) {
                        dispatch('doCallHold', {callId: call._id, toHold: false})
                    }
                });

                // Take all received tracks from the sessions you want to merge
                let receivedTracks = [];

                sessions.forEach(session => {
                    if (session !== null && session !== undefined) {
                        session.connection.getReceivers().forEach(receiver => {
                            receivedTracks.push(receiver.track);
                        });
                    }
                });

                // Use the Web Audio API to mix the received tracks
                const audioContext = new AudioContext();
                const allReceivedMediaStreams = new MediaStream();

                // For each call we will build dedicated mix for all other calls
                await forEach(sessions, async session => {
                    if (session === null || session === undefined) {
                        return
                    }

                    const mixedOutput = audioContext.createMediaStreamDestination();

                    session.connection.getReceivers().forEach(receiver => {
                        receivedTracks.forEach(track => {
                            allReceivedMediaStreams.addTrack(receiver.track);

                            if (receiver.track.id !== track.id) {
                                let sourceStream = audioContext.createMediaStreamSource(new MediaStream([track]));

                                sourceStream.connect(mixedOutput);
                            }
                        });
                    });

                    if (sessions[0].roomId === getters.getCurrentActiveRoomId) {
                        // Mixing your voice with all the received audio
                        const stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                        const sourceStream = audioContext.createMediaStreamSource(stream);

                        sourceStream.connect(mixedOutput);
                    }

                    if (session.connection.getSenders()[0]) {
                        await session.connection.getSenders()[0].replaceTrack(mixedOutput.stream.getTracks()[0]);
                    }
                });
            },
            _triggerListener({getters}, {listenerType, session, event}) {
                const listener = getters.getListeners[listenerType];

                if (!listener) {
                    return
                }

                listener(session, event);
            },
            async setMediaDevices({commit, dispatch}) {
                const devices = await navigator.mediaDevices.enumerateDevices();

                commit(types.SET_MEDIA_DEVICES, devices);

                dispatch('setMicrophone', '');
                dispatch('setSpeaker', '');
            },
            async setMicrophone({commit, getters, dispatch}, dId) {
                if (!getters.getInputDeviceList.find(({deviceId}) => deviceId === dId)) {
                    return
                }

                let stream = null;

                try {
                    stream = await navigator.mediaDevices.getUserMedia(getters.getUserMediaConstraints);
                } catch (err) {
                    console.error(err);
                }

                commit(types.SET_SELECTED_INPUT_DEVICE, dId);

                if (Object.keys(getters.getActiveCalls).length === 0) {
                    return;
                }

                const callsInCurrentRoom = Object.values(activeCalls).filter(call => call.roomId === getters.getCurrentActiveRoomId);

                if (callsInCurrentRoom.length === 1) {
                    Object.values(activeCalls).forEach(call => {
                        call.connection.getSenders()[0].replaceTrack(stream.getTracks()[0]);
                        commit(types.UPDATE_CALL, call);
                    });
                } else {
                    await dispatch('_doConference', callsInCurrentRoom);
                }
            },
            async setSpeaker({commit, getters, dispatch}, dId) {
                if (!getters.getOutputDeviceList.find(({deviceId}) => deviceId === dId)) {
                    return
                }

                commit(types.SET_SELECTED_OUTPUT_DEVICE, dId);

                const activeCallList = Object.values(activeCalls);

                if (activeCallList.length === 0) {
                    return;
                }

                const callsInCurrentRoom = activeCallList.filter(call => call.roomId === getters.getCurrentActiveRoomId);

                if (callsInCurrentRoom.length === 1) {
                    activeCallList.forEach(call => {
                        call.audioTag.setSinkId(dId);
                        commit(types.UPDATE_CALL, call);
                    });
                } else {
                    await dispatch('_doConference', callsInCurrentRoom);
                }
            },
            async setCurrentActiveRoom({commit, getters, dispatch}, roomId) {
                const oldRoomId = getters.getCurrentActiveRoomId;

                if (roomId === oldRoomId) {
                    return;
                }

                commit(types.SET_CURRENT_ACTIVE_ROOM_ID, roomId);

                await dispatch('_roomReconfigure', oldRoomId)
                await dispatch('_roomReconfigure', roomId)
            },
            doCallHold({commit}, {callId, toHold}) {
                const call = activeCalls[callId];

                if (toHold) {
                    call.hold();
                } else {
                    call.unhold();
                }

                commit(types.UPDATE_CALL, call);
            },
            doCall({getters, commit}, target) {
                if (!getters._uaInit) {
                    return console.error('Run init action first');
                }

                if (target.toString().length === 0) {
                    return console.error('Target must be passed');
                }

                const call = UA.call(`sip:${target}@${getters.getSipDomain}`, getters.getSipOptions);

                call.connection.addEventListener('addstream', e => {
                    // TODO: do one function
                    const audio = document.createElement('audio');

                    audio.id = call._id;
                    audio.class = 'audioTag';
                    audio.srcObject = e.stream;
                    audio.setSinkId(getters.getSelectedOutputDevice);
                    audio.play();
                    call.audioTag = audio;

                    commit(types.UPDATE_CALL, call);
                })
            },
            callTerminate(context, callId) {
                const call = activeCalls[callId];

                if (call._status !== 8) {
                    call.terminate();
                }
            },
            callRefer({commit, getters}, {callId, target}) {
                if (target.toString().length === 0) {
                    return console.error('Target must be passed');
                }

                const call = activeCalls[callId];

                call.refer(`sip:${target}@${getters.getSipDomain}`);
                commit(types.UPDATE_CALL, call);
            },
            callMarge({commit}, callId) {
                const call = activeCalls[callId];
                const firstActiveCall = Object.values(activeCalls).filter(c => c._id !== call._id)[0];

                call.refer(firstActiveCall.remote_identity._uri.toString(), {'replaces': firstActiveCall});
                commit(types.UPDATE_CALL, call);
            },
            callAnswer({commit, getters}, callId) {
                const call = activeCalls[callId];

                call.answer(getters.getSipOptions);
                commit(types.UPDATE_CALL, call);

                call.connection.addEventListener('addstream', (e) => {
                    // TODO: do one function
                    const audio = document.createElement('audio');

                    audio.id = call._id;
                    audio.class = 'audioTag';
                    audio.srcObject = e.stream;
                    audio.setSinkId(getters.getSelectedOutputDevice);
                    audio.play();

                    call.audioTag = audio;

                    commit(types.UPDATE_CALL, call);
                });
            },
            async callChangeRoom({dispatch}, {callId, roomId}) {
                const oldRoomId = activeCalls[callId].roomId;

                activeCalls[callId].roomId = roomId;

                return Promise.all([
                    dispatch('_roomReconfigure', oldRoomId),
                    dispatch('_roomReconfigure', roomId)
                ]).then(() => {
                    dispatch('_deleteRoomIfEmpty', oldRoomId);
                    dispatch('_deleteRoomIfEmpty', roomId);
                })
            },
            subscribe({commit}, value) {
                commit(types.ADD_LISTENER, value)
            },
            removeListener({commit}, type) {
                commit(types.REMOVE_LISTENER, type)
            },
            init({commit, dispatch}, {configuration, socketInterfaces, listeners = [], sipDomain, sipOptions}) {
                configuration.sockets = socketInterfaces.map(sock => new JsSIP.WebSocketInterface(sock))

                UA = new JsSIP.UA(configuration);
                UA.start();
                listeners.push({
                    name: 'newRTCSession',
                    cb: ({session}) => {
                        session._events.ended = function (event) {
                            dispatch('_triggerListener', {listenerType: LISTENER_TYPE.CALL_ENDED, session, event});
                            dispatch('_activeCallListRemove', session);
                        };
                        session._events.progress = function (event) {
                            dispatch('_triggerListener', {listenerType: LISTENER_TYPE.CALL_PROGRESS, session, event});
                        };
                        session._events.failed = function (event) {
                            dispatch('_triggerListener', {listenerType: LISTENER_TYPE.CALL_FAILED, session, event});
                            dispatch('_activeCallListRemove', session);
                        };
                        session._events.confirmed = function (event) {
                            dispatch('_triggerListener', {listenerType: LISTENER_TYPE.CALL_CONFIRMED, session, event});
                            commit(types.UPDATE_CALL, session);
                        };

                        dispatch('_triggerListener', {listenerType: LISTENER_TYPE.NEW_CALL, session});
                        dispatch('_addCall', session);

                        if (session.direction === 'incoming') {
                            dispatch('playBeep');
                        }
                    }
                });

                listeners.forEach(({name, cb}) => UA.on(name, cb));

                commit(types.SET_SIP_DOMAIN, sipDomain);
                commit(types.SET_SIP_OPTIONS, sipOptions);
                commit(types.SET_UA_INIT);
            }
        }
    });
}

export default {
    /**
     * @param {Object} Vue
     * @param {VSIPOptions} options
     */
    install(Vue, options) {
        initStoreModule(options);
    }
}
