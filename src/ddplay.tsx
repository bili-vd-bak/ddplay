"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Artplayer from "./components/ArtPlayer";
import artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import * as idb from "idb-keyval";
import * as FTC from "./utils/FileTypeCheck";
import { md5 } from "hash-wasm";
import { MutableRefObject, useEffect, useRef, useState } from "react";

export default function Home({}: { path?: string; default?: boolean }) {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12/dist/esm",
    art = useRef<artplayer>() as MutableRefObject<artplayer>,
    ffmpegRef = useRef(new FFmpeg()),
    messageRef = useRef<HTMLParagraphElement | null>(null);

  // const [cfg_ffmpeg_on, setCfg_ffmpeg_on] = useState(false);
  // const [cfg_ffmpeg_readsub, setCfg_ffmpeg_readsub] = useState(false);
  // const [cfg_dd_autodan, setCfg_dd_autodan] = useState(false);
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

  const getFileHash = async (buffer: ArrayBuffer) => {
    // 计算前 16MB 的 MD5
    const length = 16 * 1024 * 1024;
    buffer = buffer.slice(0, length);
    const fileHash = md5(new Uint8Array(buffer));
    return fileHash;
  };
  const matchAudio = async (file?: File, title?: string, hash?: string) => {
    let payload = {};
    if (file) {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file.slice(0, 16 * 1024 * 1024));
        reader.onload = (e) => {
          resolve(e.target?.result as ArrayBuffer);
        };
        reader.onerror = (e) => {
          reject(e);
        };
      });

      payload = {
        fileHash: await getFileHash(arrayBuffer),
        fileName: file.name,
        fileSize: file.size,
      };
    } else if (title || hash)
      payload = {
        fileHash: hash || "8733483666773cacbd79ac6f6ad56d6d",
        fileName: title || "86",
        fileSize: 0,
      };

    const url = `${cfg?.dd?.api}/api/v2/match`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return [payload, data];
  };
  // type Comment = {
  //   text: string;
  //   time: number;
  //   color: string;
  //   border: boolean;
  //   mode: 0 | 1;
  // };
  // const fetchComments = async (episodeId: string): Promise<Comment[]> => {
  //   const url = `${cfg?.dd?.api}/api/v2/comment/${episodeId}?withRelated=true&chConvert=1`;

  //   const response = await fetch(url);
  //   const data = await response.json();

  //   const comments: Comment[] = [];
  //   for (const comment of data.comments) {
  //     const params = comment.p.split(",");

  //     comments.push({
  //       text: comment.m,
  //       time: parseInt(params[0]),
  //       color: params[2],
  //       border: false,
  //       mode: 0,
  //     });
  //   }

  //   return comments;
  // };

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg.loaded) return;
    ffmpeg.on("log", ({ message }: { message: string }) => {
      if (messageRef.current)
        messageRef.current.innerHTML += message + "<br />";
      console.log(message);
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: window.URL.createObjectURL(
        new Blob([(await idb.get("ffmpeg-core.wasm")) as ArrayBuffer], {
          type: "application/wasm",
        })
      ),
      // workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
    console.log(ffmpeg);
  };

  // const fInfo = async (url: File) => {
  //   const ffmpeg = ffmpegRef.current;
  //   await ffmpeg.writeFile("input.mkv", await fetchFile(url));
  //   console.log(await ffmpeg.exec(["-i", "input.mkv"]));
  // };

  const fSub = async (url: File) => {
    const ffmpeg = ffmpegRef.current;
    // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
    await ffmpeg.writeFile("sub.srt", "");
    await ffmpeg.writeFile("input.mkv", await fetchFile(url));
    await ffmpeg.exec(["-i", "input.mkv", "-map", "0:s:0?", "sub.srt"]);
    const data = (await ffmpeg.readFile("sub.srt")) as any;
    return URL.createObjectURL(new Blob([data.buffer], { type: "text/srt" }));
  };

  const l = (c = cfg) => {
    if (c?.ff?.on)
      try {
        load();
      } catch (err) {
        alert(err);
      }
  };
  useEffect(() => {
    idb
      .get("cfg")
      .then((val) => {
        setCfg(val);
        l(val);
      })
      .catch((err) => {
        l();
        console.error(err);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p ref={messageRef}></p>
      <Artplayer
        option={{
          url: "",
          autoSize: true,
          playbackRate: true,
          aspectRatio: true,
          setting: true,
          hotkey: true,
          mutex: true,
          fullscreen: true,
          fullscreenWeb: true,
          fastForward: true,
          subtitleOffset: true,
          miniProgressBar: true,
          lang: "zh-cn",
        }}
        style={{
          width: "600px",
          height: "400px",
          margin: "60px auto 0",
        }}
        getInstance={(art_I) => {
          if (art.current) {
            // console.log(art.current);
            art_I.destroy();
          }
          art.current = art_I;
          // art_I.on("subtitleUpdate", (text) => {
          //   if (text.trim()) {
          //     art_I.subtitle.style("background-color", "rgba(0, 0, 0, 0.65)");
          //     art_I.subtitle.style({
          //       width: "fit-content",
          //       left: "50%",
          //       transform: "translateX(-50%)",
          //       padding: "10px",
          //       borderRadius: "6px",
          //     });
          //   } else {
          //     art_I.subtitle.style("background-color", "rgba(0, 0, 0, 0)");
          //     art_I.subtitle.style({
          //       width: "",
          //       left: "",
          //       transform: "",
          //       padding: "",
          //       borderRadius: "",
          //     });
          //   }
          // });
          // console.log(art_I);
        }}
      />
      <p>
        视频文件:
        <input
          type="file"
          // onChange={onPlay}
          onInput={async (e) => {
            const et = e?.target as HTMLInputElement;
            if (et.files) {
              const video_file = et.files[0],
                video_url = URL.createObjectURL(video_file);
              // await fInfo(e.target.files[0]);
              if (cfg?.ff?.on) {
                if (cfg?.ff?.readsub)
                  art.current.subtitle.switch(await fSub(video_file), {
                    type: "srt",
                    escape: false,
                  });
              }
              if (cfg?.dd?.autodan && cfg?.dd?.api) {
                const file = et.files[0];
                let matchData: any = null;
                try {
                  matchData = (await matchAudio(file))[1];
                  // setDescription(JSON.stringify(matchData))
                } catch (e) {
                  console.error(e);
                  console.log("匹配失败");
                  return;
                }
                if (
                  matchData.errorCode !== 0 ||
                  matchData?.matches?.length === 0
                ) {
                  console.log("匹配失败");
                  return;
                }
                console.log("正在获取弹幕");
                const match = matchData.matches[0];
                art.current.plugins.add(
                  artplayerPluginDanmuku({
                    danmuku: `${cfg?.dd?.api}/api/v2/comment/${match.episodeId}?withRelated=true&chConvert=1`,
                    synchronousPlayback: true,
                    opacity: 0.6,
                    heatmap: true,
                    // speed: 10,
                  })
                );
              }
              art.current.switchUrl(video_url);
            }
          }}
          className="file-input file-input-bordered file-input-primary w-full max-w-xs"
        />
      </p>
      <p>
        自定义字幕(.srt/ass/vtt):
        <input
          type="file"
          onInput={(e) => {
            const et = e?.target as HTMLInputElement;
            if (et.files) {
              const sub_url = URL.createObjectURL(et.files[0]),
                sub_name = et.files[0].name,
                sub_ext = FTC.EXT(sub_name);
              art.current.subtitle.switch(sub_url, {
                url: sub_url,
                type: sub_ext,
                escape: false,
              });
              // setUrlsub(URL.createObjectURL(e.target.files[0]));
            }
          }}
          className="file-input file-input-bordered file-input-secondary w-full max-w-xs"
        />
      </p>
      <p>
        自定义弹幕(.xml):
        <input
          type="file"
          onInput={(e) => {
            const et = e?.target as HTMLInputElement;
            if (et.files) {
              art.current.plugins.add(
                artplayerPluginDanmuku({
                  danmuku: URL.createObjectURL(et.files[0]),
                  synchronousPlayback: true,
                  opacity: 0.6,
                  heatmap: true,
                  // speed: 10,
                })
              );
              // art.current.plugins = URL.createObjectURL(e.target.files[0]);
              // setUrldan(URL.createObjectURL(e.target.files[0]));
            }
          }}
          className="file-input file-input-bordered file-input-secondary w-full max-w-xs"
        />
      </p>
    </main>
  );
}
