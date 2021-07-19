# vsip
A vue based jssip wrapper. 

## Installation
Using npm:
```shell
$ npm i -g npm
$ npm i vsip
```

## Usage
Firstly use the lib:
```javascript
import VueJsSIP from 'vsip';

Vue.use(VueJsSIP, {
    store // Vuex store
});
```
This lib will be injected to your Vex as a `vsip` module.

To init library call `init` action with the following options:
```json
{
  "configuration": {
    "session_timers": Boolean,
    "uri": String,
    "password": String,
  },
  "socketInterfaces": [String],
  "sipDomain": String,
  "sipOptions": {
    "session_timers": Boolean,
    "extraHeaders": [String],
    "pcConfig": {}
  }
}
```

Then you will be able to use getters and call actions.

### Actions
- `async setMediaDevices()` - will set up media devices
- `async setMicrophone(deviceId: Number)` - set passed device as input for calls
- `async setSpeaker(deviceId: Number)` - set passed device as output for calls
- `async setCurrentActiveRoom(roomId: Number)` - move to the room
- `doCallHold({callId: Number, toHold: Boolean})` - hold/unhold call by id
- `doCall(target: String)` - call to the target
- `callTerminate(callId: Number)` - terminate call
- `callRefer({callId: Number, target: String})` - transfer call to target
- `callMarge(callId: Number)` - merge passed call with first active
- `callAnswer(callId: Number)` - answer the call
- `async callChangeRoom({callId: Number, roomId: Number})` - move call to the room
- `subscribe({type: String, listener: function})` - subscribe to an event. Available events: `new_call`, `ended`, `progress`, `failed`, `confirmed` 
- `removeListener(type: String)` - remove event listener
- `init({configuration: Object, socketInterfaces: String[], listeners: Array, sipDomain: String, sipOptions: Object})` - init the lib

### Getters
- `getActiveRooms: []` - returns a list of active rooms
- `getSipDomain: String` - returns sip domain 
- `getSiOptions: Object` - returns sip options 
- `getInputDeviceList: []` - returns list of input devices 
- `getOutputDeviceList: []` - returns list of output devices 
- `getCurrentActiveRoomId: Number` - returns current active room id
- `getSelectedInputDevice: Number` - returns current selected input device
- `getSelectedOutputDevice: Number` - returns current selected output device