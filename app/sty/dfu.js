var fs = require("fs")
var lob = require("lob-enc")
var crc = require("crc")


// Expanded bitmasks of nRF51 Image Types
const nrf51ImageTypeNone = 0;
const nrf51ImageTypeSoftdevice = 1;
const nrf51ImageTypeBootloader = 2;
const nrf51ImageTypeSoftdeviceAndBootloader = 3;
const nrf51ImageTypeApplication = 4;
const nrf51ImageTypeBootloaderAndApplication = 6;
const nrf51ImageTypeSoftdeviceAndBootloaderAndApplication = 7;

const STM32_DFU_LOCATION = 0x180000;
const FALLBACK_DFU_LOCATION = 0xDC000;
const BOOTLOADER_DFU_LOCATION = 0x0DA000;
const L21_DFU_LOCATION = 0x1C0000;

const dfuRun = (link, firmware, type, tick) => new Promise((res, rej) =>{
  var json = {type:'dfu-all', dfu:type};
  var stats = fs.statSync(firmware);
  json.total = stats.size;
  var channel = link.x.channel({json:json});
  var done = false;
  channel.receiving = function(err, packet, cbChan)
  {
    //console.log("DFU done.");
    tick();
    cbChan();
    if (!done){
      done = true;
      res()
    }
  }
  //console.log('sending dfu for', json);
  channel.send({json:json});
  setTimeout(() => {
    if (!done){
      done = true;
      res()
    }
  }, 30000)
})

const storagefu = (link,firmware, type, bar) => new Promise((res,rej) => {
  var tick = bar("red");
  var start;
    switch(type) {
    case "stm32":
      start = STM32_DFU_LOCATION;
      break;
    case "bootloader":
      start = BOOTLOADER_DFU_LOCATION;
      break;
    case "l21":
      start = L21_DFU_LOCATION;
      break;
    case "fallback":
      start = FALLBACK_DFU_LOCATION;
      break;
    default:
      printf("Unnamed start location, using", parseInt(startValue));
    }
    var json = {type:'storage', start:start};
    var stats = fs.statSync(firmware);
    json.total = stats.size;
    var channel = link.x.channel({json:json});
    var start = Date.now();
    //console.log("Storage opening ", firmware);
    //console.log("Starting with ", json);

    var fd = fs.openSync(firmware,'r');
    var offset = 0;
    var size = 1024;
    var checksum;
    channel.receiving = function(err, packet, cbChan)
    {
      tick()
  //    //console.log("We got a packet on the dfu-stm32 channel\n");
      // any responce is next frame
      if(packet && fd)
      {
        var json = {at:offset};
        var body = new Buffer(1024);
        var readLength = fs.readSync(fd,body,0,size,offset);
        if (readLength < 1024) {
          body.length = readLength;
        }
        offset += readLength;
        //buf.copy(body,0,0,body.length);
        checksum = crc.crc32(body,checksum);
        // if at the end, include total checksum
        if(readLength != size)
        {
          json.done = checksum;
          json.end = true;
          fs.closeSync(fd);
          fd = undefined
        }
        channel.send({json:json,body:body});
      }else{
        if (type === "bootloader")
          dfuRun(link, firmware, type, tick).then((r) => res(r)).catch((er) => rej(er));
        else
          res();
      }
      cbChan();
    }
    channel.send({json:json});
  })


module.exports = {
  patch : function dfu(link, firmware, bar)
  {

    return new Promise((res, rej) => {
      var tick = bar("blue")
    var json = {type:'dfu'};
    var channel = link.x.channel({json:json});
    var start = Date.now();
    //console.log("DFU opening ", firmware);
    var fd = fs.openSync(firmware,'r');
    var offset = 0;
    var size = 1024;
    var checksum;
    var totalLen = 0;
    var progress 
    channel.receiving = function(err, packet, cbChan)
    {
  //    //console.log("We got a packet on the dfu channel\n");
      // any responce is next frame
      if(packet && packet.json && packet.json.end)
      {
        //console.log("got end")
        tick()
        res();
        fs.closeSync(fd);
        fd = undefined;

        error(packet.json.error);
        return;
      }

      if(packet && fd)
      {
        tick()
        var json = {at:offset};
        var body = new Buffer(1024);
        var readLength = fs.readSync(fd,body,0,size,offset);
        totalLen += readLength;
        if (readLength < 1024) {
          body.length = readLength;
        }
  //      //console.log("dfu chunk:", body);
        offset += readLength;
        //buf.copy(body,0,0,body.length);
        checksum = crc.crc32(body,checksum);
        // if at the end, include total checksum
        if(readLength != size)
        {
          ////console.log("done, allowing time for reset: ", totalLen);
          //console.log("dfu done, wait for reset...")
          res()
          json.done = checksum;
          //json.end = true;
          //fs.closeSync(fd);
          //fd = undefined
        }
        //process.stdout.write(".")
  //      //console.log('\n\ndfu frame',json,readLength, body);
        channel.send({json:json,body:body});
      }else{
        
          tick()
          res()
        
      }
      cbChan();
    }
    //console.log('\n\ndfu initiating',link.hashname);
    channel.send({json:json});
    })

  },

  directive : function(link, firmware){
    return new Promise((res, rej) => {
      var json = {type:'directive'};
      var channel = link.x.channel({json:json});
      var start = Date.now();
      //console.log("DFU-DIRECTIVE opening ", firmware);
      var body = new Buffer(fs.readFileSync(firmware, "utf8").replace(/\n$/, ''));
      //console.log(body.toString())
      channel.receiving = function(err, packet, cbChan)
      {
       //console.log("We got a packet on the dfu-directive channel\n");
        // any responce is next frame
        if(packet)
        {
          //console.log(packet.toString(), packet.json)
          res(packet.json)
        }else{
          rej()
        }
        cbChan();
      }
      //console.log('\n\ndfu-directive initiating',link.hashname);
      channel.send({json:json, body: body});    
    })
  },

  tap : function dfu_stm32(link,firmware, bar)
  {
    return new Promise((res, rej) => {
     var tick = bar("green");

    var json = {type:'dfu-stm32'};
    var channel = link.x.channel({json:json});
    var start = Date.now();
    //console.log("DFU-STM32 opening ", firmware);
    var fd = fs.openSync(firmware,'r');
    var offset = 0;
    var size = 1024;
    var checksum;
    channel.receiving = function(err, packet, cbChan)
    {
  //    //console.log("We got a packet on the dfu-stm32 channel\n");
      // any responce is next frame
      if(packet && fd)
      {
        tick();
        var json = {at:offset};
        var body = new Buffer(1024);
        var readLength = fs.readSync(fd,body,0,size,offset);
        if (readLength < 1024) {
          body.length = readLength;
        }
  //      //console.log("dfu-stm32 chunk:", body);
        offset += readLength;
        //buf.copy(body,0,0,body.length);
        checksum = crc.crc32(body,checksum);
        // if at the end, include total checksum
        if(readLength != size)
        {
          json.done = checksum;
          json.end = true;
          fs.closeSync(fd);
          fd = undefined
        }
        //process.stdout.write(".")
  //      //console.log('\n\ndfu-stm32 frame',json,readLength, body);
        channel.send({json:json,body:body});
      }else{
        tick();
        //console.log("dfu-stm32 done, wait for reset...")
          res()
      }
      cbChan();
    }
    //console.log('\n\ndfu-stm32 initiating',link.hashname);
    channel.send({json:json});    
    })

  },

  dfu_nrf51 : function dfu_nrf51(link,firmware,imageType,imageSizeSoftdevice,imageSizeBootloader,imageSizeApplication)
  {
    return new Promise((res, rej) => {
        var json = {type:'dfu-nrf51'};
    var channel = link.x.channel({json:json});
    var start = Date.now();
    var fd = fs.openSync(firmware,'r');
    var stats = fs.statSync(firmware);
    var imageSizeTotal = stats.size;
    //console.log("DFU-NRF51 opening ", firmware, " of type ", imageType, ", size ", imageSizeTotal);
    var offset = 0;
    var size = 1024;
    var checksum;

    // Validate image sizing
    // If we have a single image, just use the file size
    // Otherwise we need to make sure the sizes add up to the file provided
    if (imageType == nrf51ImageTypeNone) {
      //console.log("DFU-NRF51 no valid image type provided");
      return 0;
    } else if (imageType == nrf51ImageTypeSoftdevice) {
      imageSizeSoftdevice = imageSizeTotal;
    } else if (imageType == nrf51ImageTypeBootloader) {
      imageSizeBootloader = imageSizeTotal;
    } else if (imageType == nrf51ImageTypeApplication) {
      imageSizeApplication = imageSizeTotal;
    } else {
      // Multiple images
      // Only use sizes for images specified in type
      imageSizeSoftdevice = (imageType & nrf51ImageTypeSoftdevice) ? imageSizeSoftdevice : 0;
      imageSizeBootloader = (imageType & nrf51ImageTypeBootloader) ? imageSizeBootloader : 0;
      imageSizeApplication = (imageType & nrf51ImageTypeApplication) ? imageSizeApplication : 0;
      if (imageSizeTotal != (imageSizeSoftdevice + imageSizeBootloader + imageSizeApplication)) {
        //console.log("DFU-NRF51 Invalid image sizes provided; does not add up to file size");
        //console.log("TOTAL: ", imageSizeTotal, imageSizeSoftdevice + imageSizeBootloader + imageSizeApplication)
        //console.log("SD: ", imageSizeSoftdevice, " BL: ", imageSizeBootloader, " APP: ", imageSizeApplication);
        return 0;
      }
    }
       

    channel.receiving = function(err, packet, cbChan)
    {
  //    //console.log("We got a packet on the dfu-nrf51 channel\n");
      // any responce is next frame
      if(packet && fd)
      {
        var json = {at:offset};
        var body = new Buffer(1024);
        var readLength = fs.readSync(fd,body,0,size,offset);
        if (readLength < 1024) {
          body.length = readLength;
        }
        // On the first frame include the image sizes and type
        if (offset == 0) {
          json.start = true;
          if(imageType & nrf51ImageTypeSoftdevice) {
            json.imageSizeSoftdevice = imageSizeSoftdevice;
          }
          if(imageType & nrf51ImageTypeBootloader) {
            json.imageSizeBootloader = imageSizeBootloader;
          }
          if(imageType & nrf51ImageTypeApplication) {
            json.imageSizeApplication = imageSizeApplication;
          }
          json.imageType = imageType;
        }
  //      //console.log("dfu-nrf51 chunk:", body);
        offset += readLength;
        //buf.copy(body,0,0,body.length);
        checksum = crc.crc32(body,checksum);
        // if at the end, include total checksum and image type
        if(readLength != size)
        {
          json.done = checksum;
          json.end = true;
          fs.closeSync(fd);
          fd = undefined
        }
        //process.stdout.write(".")
  //      //console.log('\n\ndfu-nrf51 frame',json,readLength, body);
        channel.send({json:json,body:body});
      }else{
        res()
        //console.log('\n\ndfu-nrf51 frame error',err);
      }
      cbChan();
    }
    //console.log('\n\ndfu-nrf51 initiating',link.hashname);
    channel.send({json:json});
    })

  },
  bootloader : (link, firmware,bar) => storagefu(link, firmware, "bootloader",bar),
  fallback : (link, firmware,bar) => storagefu(link, firmware, "fallback",bar)


}