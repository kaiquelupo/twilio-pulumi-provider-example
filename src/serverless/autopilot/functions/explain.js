exports.handler = (context, event, callback) => {

  callback(null, {
      actions: [
        { say: `This is how this app works...`},
        { say: `This is just an example on how to deploy everything in Twilio using Infra-as-code`},
        { listen: true }
      ]
  });

}