exports.handler = (context, event, callback) => {

    callback(null, {
        actions: [
          { say: `Perfect! Following is the catalog:`},
          { say: `- A`},
          { say: `- B`},
          { say: `- C`},
          { listen: true }
        ]
    });

}