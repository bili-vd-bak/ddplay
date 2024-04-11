import { Ref, useEffect, useRef } from "react";
import Artplayer from "artplayer";
// import { type Option } from "artplayer/types/option";

export default function Player({
  option,
  getInstance,
  ...rest
}: {
  option: any;
  getInstance: (art: Artplayer) => unknown;
  [key: string]: any;
}) {
  const artRef = useRef<Artplayer>();

  useEffect(() => {
    const art = new Artplayer({
      ...option,
      container: artRef.current as unknown as string | HTMLDivElement,
    });

    if (getInstance && typeof getInstance === "function") {
      getInstance(art);
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={artRef as unknown as Ref<HTMLDivElement>} {...rest}></div>;
}
