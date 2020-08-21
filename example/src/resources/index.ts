import * as pulumi from "@pulumi/pulumi";
import * as twilio from '../../../twilioPulumiPlugin';

const stack = pulumi.getStack();
const serviceName = 'pulumi-serverless-example';

const domain = twilio.CheckServerless.getDomainName(serviceName, stack);

const flexWorkspace = new twilio.Resource("flex-workspace", {
    resource: ["taskrouter", "workspaces"],
    attributes: {
        sid: process.env.FLEX_WORKFLOW_SID,
        eventCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/hello-world`)
    }
});

const workspace = new twilio.Resource("pulumi-workspace", {
    resource: ["taskrouter", "workspaces"],
    attributes: {
        friendlyName: "Pulumi Workspace"
    }
});

const englishTaskQueue = new twilio.Resource("pulumi-english-taskQueue", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "taskQueues"],
    attributes: {
        targetWorkers: `languages HAS "english"`,
        friendlyName: 'English Queue'
    }
});

const spanishTaskQueue = new twilio.Resource("pulumi-spanish-taskQueue", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "taskQueues"],
    attributes: {
        targetWorkers: `languages HAS "spanish"`,
        friendlyName: 'Spanish Queue'
    }
});

const worker = new twilio.Resource("pulumi-worker", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "workers"],
    attributes: {
        friendlyName: 'Worker 1',
        attributes: JSON.stringify({ email: "worker1@email.com", languages: ["english", "spanish"] })
    }
});

const workflow = new twilio.Resource("pulumi-workflow", {
    resource: ["taskrouter", { "workspaces" : workspace.sid }, "workflows"],
    attributes: {
        assignmentCallbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/hello-world`),
        fallbackAssignmentCallbackUrl: 'https://example2.com/',
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

const flow = new twilio.Resource("pulumi-studio", {
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
            
const serverless = new twilio.Serverless("functions-assets", {
    attributes: {
        cwd: `../serverless`,
        serviceName,          
        envPath: `.${stack}.env`,
        functionsEnv: stack
    }
});
 
const flexPlugins = new twilio.FlexPlugins("flex-plugins", { 
    attributes: {
        cwd: "../flex-plugins",
        env: pulumi.all([domain]).apply(([ domain ]) => (
            {
                REACT_APP_SERVERLESS_DOMAIN_NAME: domain
            }
        ))
    }
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
    flexPluginsServiceSid: flexPlugins.sid
}
