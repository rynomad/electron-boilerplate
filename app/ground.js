import Core from "thc";
var _middlewares = {}
import  SerialHost  from 'telehash-transport-serial-host-electron';
_middlewares['SerialHost'] = SerialHost;
export const Ground = (config, cb) => {
  let core = Core(cb);
  Object.keys(_middlewares).forEach((mw) => {
    core.use(_middlewares[mw](config[mw]));
  })
  return core;
}

export default Ground;