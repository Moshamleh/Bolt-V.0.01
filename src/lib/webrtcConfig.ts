export const rtcConfig = {
  iceServers: [
    {
      urls: import.meta.env.VITE_WEBRTC_STUN_SERVERS.split(","),
    },
    {
      urls: import.meta.env.VITE_WEBRTC_TURN_SERVER,
      username: import.meta.env.VITE_WEBRTC_TURN_USERNAME,
      credential: import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL,
    },
  ],
};
