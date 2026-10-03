import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "music.note.list": "queue-music",
  "books.vertical.fill": "library-music",
  "person.fill": "person",
  "command.square.fill": "dashboard",
  // Player controls
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "forward.fill": "skip-next",
  "backward.fill": "skip-previous",
  "shuffle": "shuffle",
  "repeat": "repeat",
  "repeat.1": "repeat-one",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  // Actions
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "plus.circle.fill": "add-circle",
  "square.and.arrow.up": "share",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-vert",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "checkmark.circle.fill": "check-circle",
  "arrow.left": "arrow-back",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // CEO Dashboard
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "bolt.fill": "bolt",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.seal.fill": "verified",
  "power": "power-settings-new",
  "brain": "psychology",
  "cpu": "memory",
  "network": "hub",
  "megaphone.fill": "campaign",
  "gear": "settings",
  "bell.fill": "notifications",
  "bell": "notifications-none",
  "magnifyingglass": "search",
  "waveform": "graphic-eq",
  "music.note": "music-note",
  "star.fill": "star",
  "crown.fill": "workspace-premium",
  "lock.fill": "lock",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "info.circle": "info",
  "person.2.fill": "group",
  "dollarsign.circle.fill": "monetization-on",
  "arrow.clockwise": "refresh",
  "list.bullet": "list",
  "square.grid.2x2.fill": "grid-view",
  "mic.fill": "mic",
  "sparkles": "auto-awesome",
  "xmark.circle": "cancel",
  "play": "play-arrow",
  "send": "send",
  "queue.badge.plus": "playlist-add",
  "text.quote": "format-quote",
  "lightbulb.fill": "lightbulb",
  "person.crop.circle": "account-circle",
  "checkmark": "check",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name] ?? "music-note";
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}
