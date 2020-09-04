exports.handler = (context, event, callback) => {

    callback(null, {
        actions: [
          { say: "Hey! Nice to have you here! Do you want to understand *how this app works* or *see the catalog*?"},
          { listen: true }
        ]
    });

}