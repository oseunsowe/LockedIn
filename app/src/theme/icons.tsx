import {
  Activity,
  BadgeCheck,
  Briefcase,
  Camera,
  ChartNoAxesColumn,
  CircleUser,
  Clock,
  Code,
  Dumbbell,
  Flame,
  Gem,
  GitBranch,
  GraduationCap,
  Heart,
  House,
  Link,
  Loader,
  Lock,
  Mic,
  Paperclip,
  PenLine,
  PersonStanding,
  Play,
  Repeat,
  RotateCcw,
  Signal,
  Sparkles,
  Star,
  Sun,
  Swords,
  Timer,
  TrendingUp,
  X,
  Zap,
  Image as ImageGlyph,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { semantic, withAlpha } from './colors';
import { radius } from './spacing';

/**
 * Semantic icon registry — one map, referenced everywhere. Never import a Lucide glyph
 * directly into a screen; that's what makes swapping packs or enforcing stroke weight possible.
 * An unknown `IconName` is a compile error by construction (TS infers the key union from this object).
 */
export const iconRegistry = {
  // Nav
  home: House,
  missions: Swords,
  progress: ChartNoAxesColumn,
  ai: Sparkles,
  profile: CircleUser,

  // Identity classes
  developer: Code,
  founder: Star,
  creator: Sun,
  student: GraduationCap,
  athlete: PersonStanding,
  professional: Briefcase,
  entrepreneur: Zap,
  designer: PenLine,

  // Campaigns
  activity: Activity,
  gem: Gem,
  clock: Clock,
  dumbbell: Dumbbell,
  'trending-up': TrendingUp,
  play: Play,
  heart: Heart,
  sun: Sun,

  // Proof
  camera: Camera,
  screenshot: ImageGlyph,
  voice: Mic,
  file: Paperclip,
  link: Link,

  // Mission
  mainQuest: Flame,
  side: GitBranch,
  daily: Repeat,
  timer: Timer,
  difficulty: Signal,
  xp: Zap,

  // Status
  verified: BadgeCheck,
  pending: Loader,
  failed: RotateCcw,
  streak: Flame,
  locked: Lock,

  // Chrome
  close: X,
  edit: PenLine,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Default stroke is lighter than Lucide's own default (2) — matches the mockups' thinner line weight. */
export function Icon({
  name,
  size = 24,
  color = semantic.text.primary,
  strokeWidth = 1.5,
}: IconProps) {
  const Glyph = iconRegistry[name];
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}

type IconTileProps = {
  name: IconName;
  accent: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
};

/**
 * Rounded-square icon tile — tinted `accent` fill, accent-colored glyph. This exact treatment
 * appears on every card in every mockup (class cards, campaign rows, proof options).
 */
export function IconTile({ name, accent, size = 48, iconSize, style }: IconTileProps) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: withAlpha(accent, 0.14) },
        style,
      ]}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
