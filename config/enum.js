export const CALL_EVENT_LISTENER_TYPE = {
    NEW_CALL: 'new_call',
    CALL_CONFIRMED: 'confirmed',
    CALL_FAILED: 'failed',
    CALL_PROGRESS: 'progress',
    CALL_ENDED: 'ended'
}

export const CONSTRAINTS = {
    CALL_DIRECTION_OUTGOING: 'outgoing',
    CALL_DIRECTION_INCOMING: 'incoming',
    CALL_STATUS_UNANSWERED: 0
}

export const STORE_MUTATION_TYPES = {
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
    CALL_ADDING_IN_PROGRESS: 'CALL_ADDING_IN_PROGRESS',
    SET_DND: "SET_DND",
    SET_MUTED: "SET_MUTED"
}

export const CALL_KEYS_TO_INCLUDE = ['roomId', '_audioMuted', '_cancel_reason', '_contact', 'direction', '_end_time', '_eventsCount', '_from_tag', '_id', '_is_canceled', '_is_confirmed', '_late_sdp', '_localHold', '_videoMuted', 'status', 'start_time', '_remote_identity', 'audioTag', 'audioQuality']

export const STORAGE_KEYS = {
    SELECTED_INPUT_DEVICE: 'selectedInputDevice',
    SELECTED_OUTPUT_DEVICE: 'selectedOutputDevice'
}
