import * as pulumi from "@pulumi/pulumi";
import * as twilio from "twilio"; 
import { isEqual } from "lodash";
import { getAPI, cleanObject } from "../utils/api";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

export interface WorkspaceArgs {
    resource: pulumi.Input<any>;
    attributes: pulumi.Input<any>;
}

class ResourceProvider implements pulumi.dynamic.ResourceProvider {

    public async check(olds: any, news: any): Promise<pulumi.dynamic.CheckResult> {

        return { inputs: news };

    }

    public async diff(id: pulumi.ID, olds: any, news: any): Promise<pulumi.dynamic.DiffResult> {

        // const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const { /*resource,*/ attributes } = olds.inputs;

        // if(id) {
        //     const currentResource = await getAPI(client, resource)(id).fetch();

        //     if(!isMatch(currentResource, attributes) && !isMatch(currentResource, news.attributes)){
                
        //         //TODO: show the difference

        //         throw Error(
        //             `This resource's attributes does not match with the deployed resource's attributes. `
        //           + `Please change the resource's attributes to match the current deploy`
        //         );
        //     }
        // }

        return { changes: !isEqual(attributes, news.attributes) };

    }

    public async create(inputs: any): Promise<pulumi.dynamic.CreateResult> {

        const { resource, attributes } = inputs;

        const client : any = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        let sid: string;
        let info:any;

        if(attributes.sid) {

            await getAPI(client, resource)(attributes.sid).fetch();

            ({ sid, ...info } = cleanObject(await getAPI(client, resource)(attributes.sid).update(attributes), false));

        } else {

            ({ sid, ...info } = 
                cleanObject(await (getAPI(client, resource).create(attributes)), false));

        }
            
        return {
            id: sid,
            outs: { sid, inputs, info },
        };
    }

    public async update(id:pulumi.ID, olds: any, news:any): Promise<pulumi.dynamic.UpdateResult> {

        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const { resource, attributes } = news;

        const { sid, ...info } = cleanObject(await getAPI(client, resource)(id).update(attributes), false);

        return {
            outs: { sid, inputs: news, info }
        }   
     }

    public async delete(id:pulumi.ID, props: any) {

       const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

       await getAPI(client, props.inputs.resource)(id).remove();

    }
}

export class Resource extends pulumi.dynamic.Resource {
    public readonly sid?: pulumi.Output<string>;
    public readonly inputs?: pulumi.Output<any>;
    public readonly info?: pulumi.Output<any>;

    constructor(name: string, args: WorkspaceArgs, opts?: pulumi.CustomResourceOptions) {
        super(new ResourceProvider(), name, { ...args, sid: undefined, inputs: undefined, info: undefined }, opts);
    }
}