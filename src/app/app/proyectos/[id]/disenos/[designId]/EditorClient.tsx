"use client";

import dynamic from "next/dynamic";
import { theme } from "@/lib/theme";
import type { Design } from "@/lib/types";

// react-konva toca `window` => debe cargarse solo en cliente (ssr:false).
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "60vh", display: "grid", placeItems: "center", color: theme.textMuted }}>
      Cargando editor…
    </div>
  ),
});

export default function EditorClient(props: { design: Design; projectId: string; projectName: string }) {
  return <Editor {...props} />;
}
