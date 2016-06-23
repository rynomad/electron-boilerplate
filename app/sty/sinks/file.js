var fs = require('fs')
const setup = (settings, cb) => {
    var stream = fs.createWriteStream(settings.path, {flags : 'a'})

    cb((label, event) => {
        ([label,JSON.stringify(event), "\n"]).join(",")
    })
}

const cmd = module.exports = (commandTemplate) => commandTemplate(
    "File",
    [
      ["-p,--path <accesskey>","output file"]
    ],
    setup
)