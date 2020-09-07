import { CheckServerless, Resource, Serverless, FlexPlugin } from 'twilio-pulumi-provider';
import * as pulumi from '@pulumi/pulumi';

const stack = pulumi.getStack();

const serviceName = 'example-serverless';
const domain = CheckServerless.getDomainName(serviceName, stack);

const autopilotServiceName = 'example-autopilot-serverless';
const autopilotDomain = CheckServerless.getDomainName(autopilotServiceName, stack);

const flexWorkspace = new Resource("flex-workspace", {
    resource: ["taskrouter", "workspaces"],
    attributes: {
        sid: process.env.FLEX_WORKFLOW_SID,
        eventCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/hello-world`)
    }
});

const workspace = new Resource("example-workspace", {
    resource: ["taskrouter", "workspaces"],
    attributes: {
        friendlyName: "Example Pulumi Workspace"
    }
});

const englishTaskQueue = new Resource("example-english-taskQueue", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "taskQueues"],
    attributes: {
        targetWorkers: `languages HAS "english"`,
        friendlyName: 'English Queue'
    }
});

const spanishTaskQueue = new Resource("example-spanish-taskQueue", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "taskQueues"],
    attributes: {
        targetWorkers: `languages HAS "spanish"`,
        friendlyName: 'Spanish Queue'
    }
});

const worker = new Resource("example-worker", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "workers"],
    attributes: {
        friendlyName: 'Worker 1',
        attributes: JSON.stringify({ email: "worker1@email.com", languages: ["english", "spanish"] })
    }
});

const workflow = new Resource("example-workflow", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "workflows"],
    attributes: {
        assignmentCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/hello-world`),
        friendlyName: 'Sales, Marketing, Support Workflow',
        configuration: pulumi.all([englishTaskQueue.sid, spanishTaskQueue.sid])
            .apply(([ englishTaskQueueSid, spanishTaskQueueSid ]) => JSON.stringify(
                {
                    task_routing: {
                        filters: [
                            {
                                friendlyName: "English Queue",
                                expression: `type=='english'`,
                                targets: [
                                    {
                                        queue: englishTaskQueueSid
                                    }   
                                ]
                            },
                            {
                                friendlyName: "Spanish Queue",
                                targets:[
                                    { 
                                        queue: spanishTaskQueueSid
                                    }
                                ],
                                expression: `type=='spanish'`
                            }
                        ]
                    }
                }
            ))
    },
});

const flow = new Resource("example-studio", {
    resource: ["studio", "flows"],
    attributes: {
        commitMessage: 'Release v4', 
        friendlyName: 'A New Flow v4',
        definition: {
            description: 'A New Flow',
            states: [
                {
                    name: 'Trigger',
                    type: 'trigger',
                    transitions: [
                    {
                        event: 'incomingMessage'
                    },
                    {
                        next: 'say_play_1',
                        event: 'incomingCall'
                    },
                    {
                        event: 'incomingRequest'
                    }
                    ],
                    properties: {
                        offset: {
                            x: 0,
                            y: 0
                        }
                    }
                },
                {
                    name: 'say_play_1',
                    type: 'say-play',
                    transitions: [
                        {
                            event: 'audioComplete',
                            next: 'say_play_2'
                        }
                    ],
                    properties: {
                        offset: {
                            x: 173,
                            y: 212
                        },
                        loop: 1,
                        say: 'Hello world'
                    }
                },
                {
                    name: 'say_play_2',
                    type: 'say-play',
                    transitions: [
                        {
                            event: 'audioComplete'
                        }
                    ],
                    properties: {
                        offset: {
                            x: 173,
                            y: 471
                        },
                        loop: 1,
                        say: 'Hello world 2'
                    }
                }
            ],
            initial_state: 'Trigger',
            flags: {
                allow_concurrent_calls: true
            }
        }, 
        status: 'published'
    }
});
            
const serverless = new Serverless("example-functions-assets", {
    attributes: {
        cwd: `../serverless/main`,
        serviceName,          
        envPath: `.${stack}.env`,
        functionsEnv: stack,
        pkgJson: require("../serverless/main/package.json")
    }
});
 
const soundNotificationFlexPlugin = new FlexPlugin("example-sound-notification-flex-plugin", { 
    attributes: {
        cwd: "../flex-plugins/sound-notification",
        env: pulumi.all([domain]).apply(([ domain ]) => (
            {
                REACT_APP_SERVERLESS_DOMAIN_NAME: domain
            }
        )),
        runTestsOnPreview: true
    }
});

const assistant = new Resource("example-autopilot-assistant", {
    resource: ["autopilot", "assistants"],
    attributes: {
        uniqueName: "example-assistant-2",
        friendlyName: "Example Assistant 2"
    }
},{
    protect: true
});

const greetingTask = new Resource("example-autopilot-task", {
    resource: ["autopilot", { assistants: assistant.sid }, "tasks"],
    attributes: {
      uniqueName: "greeting",
      friendlyName: "Greeting Task",
      actions: pulumi.all([autopilotDomain]).apply(([autopilotDomain]) => ({
        actions: [
          {
            redirect: {
              method: "POST",
              uri: `https://${autopilotDomain}/get-context`
            }
          }
        ]
      }))
    }
});

const samples = ["hey", "hello", "how are you?", "are you ok?"];
const taskSamples : Resource[]= [];

for(let i = 0; i < samples.length; i++) {

    taskSamples.push(new Resource(`example-autopilot-task-sample-${samples[i]}`, {
        resource: ['autopilot', { assistants: assistant.sid }, { tasks: greetingTask.sid }, 'samples'],
        attributes: {
            language: 'en-US',
            taggedText: samples[i]
        }
    }));

}


const catalogTask = new Resource("autopilot-catalog-task", {
  resource: ["autopilot", { assistants: assistant.sid }, "tasks"],
  attributes: {
    uniqueName: "catalog",
    friendlyName: "Catalog",
    actions: pulumi.all([autopilotDomain]).apply(([autopilotDomain]) => ({
      actions: [
        {
          redirect: {
            method: "POST",
            uri: `https://${autopilotDomain}/get-catalog`
          }
        }
      ]
    }))
  }
});


const samplesCatalog = ["see the catalog", "catalog", "I want to see the catalog"];

for(let i = 0; i < samplesCatalog.length; i++) {

    taskSamples.push(new Resource(`example-autopilot-catalog-task-sample-${samplesCatalog[i]}`, {
        resource: ['autopilot', { assistants: assistant.sid }, { tasks: catalogTask.sid }, 'samples'],
        attributes: {
            language: 'en-US',
            taggedText: samplesCatalog[i]
        }
    }));
}

const aboutTask = new Resource("autopilot-about-task", {
    resource: ["autopilot", { assistants: assistant.sid }, "tasks"],
    attributes: {
      uniqueName: "about",
      friendlyName: "About",
      actions: pulumi.all([autopilotDomain]).apply(([autopilotDomain]) => ({
        actions: [
          {
            redirect: {
              method: "POST",
              uri: `https://${autopilotDomain}/explain`
            }
          }
        ]
      }))
    }
  });
  
  
const samplesAbout = [
    "how this app works", 
    "what is this?", 
    "tell me about the app", 
    "explain to me what this app does"
];

for(let i = 0; i < samplesAbout.length; i++) {

    taskSamples.push(new Resource(`example-autopilot-about-task-sample-${samplesAbout[i]}`, {
        resource: ['autopilot', { assistants: assistant.sid }, { tasks: aboutTask.sid }, 'samples'],
        attributes: {
            language: 'en-US',
            taggedText: samplesAbout[i]
        }
    }));

}

const autopilotServerless = new Serverless("autopilot-serverless", {
    attributes: {
      cwd: `../serverless/autopilot`,
      serviceName: autopilotServiceName,
      env: {
        DOMAIN: autopilotDomain
      },          
      envPath: `.${stack}.env`,
      functionsEnv: stack,
      pkgJson: require("../serverless/autopilot/package.json")
    }
});

const modelBuild = new Resource('assistant-build-model', {
    resource: ['autopilot', { assistants: assistant.sid }, 'modelBuilds'],
    attributes: {
        replaceAndNotDelete: true
    }
}, {
    dependsOn: taskSamples
});

export let output =  {
    flexWorkspaceSid: flexWorkspace.sid,
    workspaceSid: workspace.sid,
    englishTaskQueueSid: englishTaskQueue.sid,
    spanishTaskQueueSid: spanishTaskQueue.sid,
    workerSid: worker.sid,
    workflowSid: workflow.sid,
    flowSid: flow.sid,
    serverlessSid: serverless.sid,
    autopilotServerlessSid: autopilotServerless.sid,
    soundNotificationFlexPluginSid: soundNotificationFlexPlugin.sid,
    modelBuildSid: modelBuild.sid
}
