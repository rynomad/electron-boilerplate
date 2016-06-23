
const Slack = require("node-slackr");

const createSlackMessage = (label, evt) => ({
  channel : args.channel || "#junk",
  text : `data from ${evt.hashname.substr(0,8)}`,
  attachments : [
    {
      fallback : JSON.stringify(evt),
      color : "good",
      fields : [
        {
          title : label,
          value : evt.data,
          short : false
        }
      ]
    }
  ]
})

const setup = (settings, cb) => {
    var slack = new Slack(settings.url, {
      channel : settings.channel,
      link_names : 1
    })


    cb((label, event) => {
      var msg = createSlackMessage(label, event);
      slack.notify(msg);
    })
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
    "Slack",
    [
      ["-u,--url <url>","Required; Slack bot url"],
      ["-c,--channel <channel>", "Required; the target channel for messages"]
    ],
    setup
  )