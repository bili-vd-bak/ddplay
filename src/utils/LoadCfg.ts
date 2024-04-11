import * as idb from "idb-keyval";

interface CFG {
  ffmpeg: {
    ver: string;
    on: boolean;
    readsub: boolean;
  };
}

export const cfg = {
  ffmpeg: {
    ver: "ok",
    on: false,
    readsub: false,
  },
};

export default async function LoadCfg(callback?: (cfg: CFG) => void) {
  await idb.get("ffmpeg-core.wasm=ver").then((val) => {
    if (val) cfg.ffmpeg.ver = val;
  });
  if (!cfg.ffmpeg.ver) return cfg;

  await idb.get("cfg_ffmpeg_on").then((val) => {
    if (val) cfg.ffmpeg.on = Boolean(val);
  });
  await idb.get("cfg_ffmpeg_readsub").then((val) => {
    if (val) cfg.ffmpeg.readsub = Boolean(val);
  });

  if (callback) callback(cfg);
  return cfg;
}
