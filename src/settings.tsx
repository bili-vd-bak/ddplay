import { downloadWithProgress } from "@ffmpeg/util";
import { useEffect, useState } from "react";
import * as idb from "idb-keyval";

/**
 * copy from @ffmpeg/util/dist/cjs/types.d.ts
 */
interface DownloadProgressEvent {
  url?: string | URL;
  total?: number;
  received?: number;
  delta?: number;
  done?: boolean;
}

export default function Settings({}: { path?: string }) {
  // const [loading, setLoading] = useState(false);
  const [pg_loadF_wasm, setPg_loadF_wasm] = useState<DownloadProgressEvent>();
  const [ver_F_wasm, setVer_F_wasm] = useState<string | Date>("");
  const [cfg, setCfg] = useState({
    ff: {
      on: false,
      readsub: false,
    },
    dd: {
      api: "https://api.dandanplay.net",
      autodan: false,
    },
  });
  // const [cfg_ffmpeg_on, setCfg_ffmpeg_on] = useState(false);
  // const [cfg_ffmpeg_readsub, setCfg_ffmpeg_readsub] = useState(false);
  // const [cfg_dd_autodan, setCfg_dd_autodan] = useState(false);

  // const toggle_idb = async (name: string) => {
  //   const state = !!(await idb.get(name));
  //   await idb.set(name, state ? false : true);
  // };

  const loadF = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12/dist/esm";
    await idb.set(
      "ffmpeg-core.wasm",
      await downloadWithProgress(
        `${baseURL}/ffmpeg-core.wasm`,
        ({ received, total, done }) => {
          setPg_loadF_wasm({
            received,
            done,
            total: total === -1 ? 32000000 : total,
          });
          if (done) {
            alert("ffmpeg.wasm 文件缓存完成!");
            const F_wasm_ver = new Date().toLocaleString();
            idb.set("ffmpeg-core.wasm=ver", F_wasm_ver);
            setVer_F_wasm(F_wasm_ver);
          }
        }
      )
    );
  };

  // idb.get("cfg_ffmpeg_on").then((val) => setCfg_ffmpeg_on(val));
  // idb.get("cfg_ffmpeg_readsub").then((val) => setCfg_ffmpeg_readsub(val));
  // idb.get("cfg_dd_autodan").then((val) => setCfg_dd_autodan(val));
  // console.log("a", cfg);

  useEffect(() => {
    idb
      .get("ffmpeg-core.wasm=ver")
      .then((val: string | Date) => setVer_F_wasm(val || ""));
    idb.get("cfg").then((val) => setCfg(val));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="divider">FFMpeg.WASM 设置</div>
      <>缓存状态：{ver_F_wasm || "未缓存"}</>
      <>
        <button onClick={loadF} className="btn btn-primary">
          加载/更新FFMpeg组件(~32MB)
        </button>
        <br />
        {pg_loadF_wasm !== undefined && pg_loadF_wasm?.done === false ? (
          <>
            <>进度:</>
            <progress
              className="progress w-56"
              value={pg_loadF_wasm?.received}
              max={pg_loadF_wasm?.total}
            />
          </>
        ) : (
          ""
        )}
      </>
      <>
        <div className="flex flex-col">
          <div className="form-control w-52">
            <label className="cursor-pointer label">
              <span className="label-text">总开关</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                disabled={!ver_F_wasm}
                checked={cfg.ff.on}
                onInput={async () => {
                  // toggle_idb("cfg_ffmpeg_on");
                  const c = {
                    ...cfg,
                    ff: {
                      ...cfg.ff,
                      on: cfg.ff.on ? false : true,
                    },
                  };
                  setCfg(c);
                  // console.log(cfg);
                  await idb.set("cfg", c);
                  // setCfg_ffmpeg_on(cfg_ffmpeg_on ? false : true);
                }}
              />
            </label>
            <label className="cursor-pointer label">
              <span className="label-text">读取视频内封字幕</span>
              <input
                type="checkbox"
                className="toggle toggle-secondary"
                disabled={!cfg.ff.on}
                checked={cfg.ff.readsub}
                onInput={async () => {
                  // toggle_idb("cfg_ffmpeg_readsub");
                  const c = {
                    ...cfg,
                    ff: {
                      ...cfg.ff,
                      readsub: cfg.ff.readsub ? false : true,
                    },
                  };
                  setCfg(c);
                  await idb.set("cfg", c);
                  // setCfg_ffmpeg_readsub(cfg_ffmpeg_readsub ? false : true);
                }}
              />
            </label>
          </div>
        </div>
      </>
      <div className="divider">弹弹Play服务 - 弹幕获取</div>
      <div className="flex flex-col">
        <div className="form-control w-152">
          <label className="cursor-pointer label">
            <span className="label-text">弹幕库API(弹弹Play格式)</span>
            <input
              type="text"
              placeholder="https://api.dandanplay.net"
              className="input input-bordered input-primary w-full max-w-xs"
              value={cfg.dd.api}
              onInput={async (e) => {
                const et = e?.target as HTMLInputElement,
                  c = {
                    ...cfg,
                    dd: {
                      ...cfg.dd,
                      api: et.value,
                    },
                  };
                // toggle_idb("cfg_dd_autodan");
                setCfg(c);
                await idb.set("cfg", c);
                // setCfg_dd_autodan(cfg_dd_autodan ? false : true);
              }}
            />
          </label>
          <label className="cursor-pointer label">
            <span className="label-text">自动获取弹幕</span>
            <input
              type="checkbox"
              className="toggle toggle-secondary"
              checked={cfg.dd.autodan}
              onInput={async () => {
                // toggle_idb("cfg_dd_autodan");
                const c = {
                  ...cfg,
                  dd: {
                    ...cfg.dd,
                    autodan: cfg.dd.autodan ? false : true,
                  },
                };
                setCfg(c);
                await idb.set("cfg", c);
                // setCfg_dd_autodan(cfg_dd_autodan ? false : true);
              }}
            />
          </label>
        </div>
      </div>
    </main>
  );
}
