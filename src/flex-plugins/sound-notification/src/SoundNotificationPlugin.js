import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'SoundNotificationPlugin';

export default class AlertTask extends FlexPlugin {

  constructor() {
    super(PLUGIN_NAME);
  }

  name = 'SoundNotificationPlugin';

  init(flex, manager) {

    console.log("SoundNotificationPlugin :D !!");

    const audio = new Audio(`https://${process.env.REACT_APP_SERVERLESS_DOMAIN_NAME}/sound-notification/ringback_tone.mp3`);
    manager.workerClient.on('reservationCreated', reservation => {

      const isVoiceQueue = reservation.task.taskChannelUniqueName === 'voice';
      const isInboundTask = reservation.task.attributes.direction === 'inbound';
      
      if (isVoiceQueue && isInboundTask) {
        playAudio(reservation);
      }

    });

    const playAudio = reservation => {

      audio.play();
      
      ['accepted', 'canceled', 'rejected', 'rescinded', 'timeout'].forEach(e => {
        reservation.on(e, () => audio.pause());
      });

    };

  }

}