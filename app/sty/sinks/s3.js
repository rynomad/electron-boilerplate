'use strict';
var fs = require("fs")
var AWS = require("aws-sdk")
var path = require("path");
process.env.DEBUG = null;

const createBucketUploader = (bucket) => (action) => new Promise((res, rej) => bucket.upload({
    Key: (new Date()).toString(),
      Body: JSON.stringify(action)
}, (err, data) => err ? rej(err) : res(action)))

var BUCKETS = {}
const createObjectKey = (type, hashname) => {
    return path.join(type, hashname)
}

const getBucket = (env) => new Promise((res, rej) => {
    process.env.AWS_ACCESS_KEY_ID = env.access;
    process.env.AWS_SECRET_ACCESS_KEY = env.secret;
    BUCKETS[env.bucket] = BUCKETS[env.bucket] || new AWS.S3({
        params: {
            Bucket: env.bucket
        }   
    })  

    res(BUCKETS[env.bucket]);
})  

const setup = (settings, cb) => {
    getBucket(settings).then((Bucket) => {
        cb((label, event) => {
            AWS.S3.getObject({
                Bucket : settings.bucket,
                key : label
            }, (err, data) => {
                if (err)
                    data = "";
                else
                    data = data.toString();

                data = data.concat(JSON.stringify(event) + "\n");

                Bucket.upload({
                    Key : label,
                    Body : data
                }, (err, data) => {
                    if (err)
                        return console.log("s3 error", err)
                    else
                        console.log("s3 sent");

                })
            })


        })
    })
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
    "S3",
    [
      ["-a,--accesskey <accesskey>","amazon access key"],
      ["-s,--secret <secretkeyid>", "amazon secret access key"],
      ["-b,--bucket <bucket>","amazon bucket name"]
    ],
    setup
)
