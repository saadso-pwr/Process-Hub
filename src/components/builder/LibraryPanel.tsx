"use client";

import { useState } from "react";
import {
  FF,
  BRAND_BLUE,
  ACCENT,
  chevBtn,
  IconBtn,
  MenuItem,
  SectionTitle,
  Hr,
  Chevron,
  PlusGlyph,
  SearchGlyph,
  ArchiveGlyph,
  TrashGlyph,
  TemplateIcon,
  PaletteIcon,
  SparkIcon,
  type LibraryItem,
  type LibraryStore,
} from "./kit";

export function LibraryPanel(props: {
  store: LibraryStore;
  ready: boolean;
  currentItemId: string | null;
  onReveal: () => void;
  onTemplate: () => void;
  onFresh: () => void;
  onAi: () => void;
  onOpenItem: (item: LibraryItem) => void;
  onNewFolder: () => void;
  onNewInFolder: (folder: string) => void;
  onUploadToFolder: (folder: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [addMenu, setAddMenu] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const active = props.store.items.filter((it) => !it.archived);
  const archived = props.store.items.filter((it) => it.archived);

  const byFolder = (folder: string) =>
    active.filter(
      (it) => it.folder === folder && (!q || it.name.toLowerCase().includes(q)),
    );

  return (
    <aside
      onMouseEnter={() => {
        if (!props.ready) props.onReveal();
      }}
      style={{
        width: 256,
        flexShrink: 0,
        borderRight: "1px solid #ececec",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "18px 16px",
        gap: 18,
      }}
    >
      {/* Generate */}
      <div>
        <SectionTitle>Generate</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <GenCard label="Start From Template" onClick={props.onTemplate} icon={<TemplateIcon />} />
          <GenCard label="Fresh Diagram" onClick={props.onFresh} icon={<PaletteIcon />} />
          <GenCard label="Converge with AI" onClick={props.onAi} icon={<SparkIcon />} highlight />
        </div>
      </div>

      <Hr />

      {/* Library */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle>Library</SectionTitle>
          <IconBtn title="New folder" onClick={props.onNewFolder}>
            <PlusGlyph />
          </IconBtn>
        </div>

        <div style={{ position: "relative", margin: "10px 0 6px" }}>
          <SearchGlyph />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={props.onReveal}
            placeholder="Search Processes"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 10px 9px 32px",
              borderRadius: 10,
              border: "1px solid #e3e3e3",
              fontFamily: FF,
              fontSize: 13,
              outline: "none",
              color: "#2a2a2a",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {props.store.folders.map((folder) => {
            const items = byFolder(folder);
            const isCollapsed = collapsed[folder] ?? false;
            return (
              <div key={folder}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [folder]: !isCollapsed }))}
                    style={chevBtn}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                  >
                    <Chevron open={!isCollapsed} />
                  </button>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1f1f1b" }}>
                    {folder}
                  </span>
                  <div style={{ position: "relative" }}>
                    <IconBtn
                      title={`Add to ${folder}`}
                      onClick={() => setAddMenu((m) => (m === folder ? null : folder))}
                    >
                      <PlusGlyph />
                    </IconBtn>
                    {addMenu === folder && (
                      <>
                        <div
                          onClick={() => setAddMenu(null)}
                          style={{ position: "fixed", inset: 0, zIndex: 40 }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 26,
                            right: 0,
                            zIndex: 41,
                            width: 196,
                            background: "#fff",
                            border: "1px solid #e4e4e4",
                            borderRadius: 10,
                            boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
                            padding: 5,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <MenuItem
                            onClick={() => {
                              setAddMenu(null);
                              props.onNewInFolder(folder);
                            }}
                          >
                            ＋ Blank diagram
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              setAddMenu(null);
                              props.onUploadToFolder(folder);
                            }}
                          >
                            ⬆ Upload PDF / PNG / SVG
                          </MenuItem>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {!isCollapsed &&
                  items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      active={it.id === props.currentItemId}
                      onOpen={() => props.onOpenItem(it)}
                      onArchive={() => props.onArchive(it.id)}
                      onDelete={() => props.onDelete(it.id)}
                    />
                  ))}
                {!isCollapsed && items.length === 0 && (
                  <p style={{ margin: "0 0 6px 26px", fontSize: 12, color: "#bdbdbd" }}>Empty</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Hr />

      {/* Archive */}
      <div>
        <button
          type="button"
          onClick={() => {
            props.onReveal();
            setArchiveOpen((v) => !v);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "2px 0",
          }}
        >
          <ArchiveGlyph />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1f1f1b" }}>Archive</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9a9a9a" }}>{archived.length}</span>
        </button>
        {archiveOpen &&
          archived.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              active={it.id === props.currentItemId}
              archivedRow
              onOpen={() => props.onOpenItem(it)}
              onArchive={() => props.onUnarchive(it.id)}
              onDelete={() => props.onDelete(it.id)}
            />
          ))}
      </div>
    </aside>
  );
}

export function ItemRow(props: {
  item: LibraryItem;
  active: boolean;
  archivedRow?: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        paddingLeft: 26,
        borderRadius: 7,
        background: props.active ? `${BRAND_BLUE}0d` : "transparent",
      }}
    >
      <button
        type="button"
        onClick={props.onOpen}
        title={props.item.name}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "7px 2px",
          fontFamily: FF,
          fontSize: 13,
          color: props.active ? BRAND_BLUE : "#7c7c75",
          fontWeight: props.active ? 600 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {props.item.kind === "media" && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              background: "#9a9a9a",
              borderRadius: 4,
              padding: "1px 4px",
              marginRight: 6,
              letterSpacing: "0.03em",
            }}
          >
            FILE
          </span>
        )}
        {props.item.name}
      </button>
      {hover && (
        <>
          <IconBtn title={props.archivedRow ? "Restore" : "Archive"} onClick={props.onArchive}>
            <ArchiveGlyph small />
          </IconBtn>
          <IconBtn title="Delete" onClick={props.onDelete}>
            <TrashGlyph />
          </IconBtn>
        </>
      )}
    </div>
  );
}

export function GenCard({
  label,
  icon,
  onClick,
  highlight,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${highlight ? ACCENT : hover ? "#cfcfcf" : "#e6e6e6"}`,
        background: highlight ? `${ACCENT}12` : hover ? "#fafafa" : "#fff",
        cursor: "pointer",
        fontFamily: FF,
        fontSize: 14,
        fontWeight: 600,
        color: "#1f1f1b",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: highlight ? ACCENT : "#6b6b66", display: "flex" }}>{icon}</span>
    </button>
  );
}

