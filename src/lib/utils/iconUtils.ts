import {
  Coins,
  Image,
  Zap,
  TrendingUp,
  Code,
  Scale,
  Folder,
  Tag,
  Hash,
  Star,
  Heart,
  Bookmark,
  Eye,
  MessageCircle,
  Share,
  Calendar,
  Clock,
  User,
  Users,
  Settings,
  Home,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  // Category icons
  coins: Coins,
  image: Image,
  zap: Zap,
  trending: TrendingUp,
  code: Code,
  scale: Scale,
  folder: Folder,
  tag: Tag,
  hash: Hash,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  eye: Eye,
  message: MessageCircle,
  share: Share,
  calendar: Calendar,
  clock: Clock,
  user: User,
  users: Users,
  settings: Settings,
  home: Home,
  search: Search,
  filter: Filter,
  plus: Plus,
  edit: Edit,
  trash: Trash2,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  moreVertical: MoreVertical,
  gripVertical: GripVertical,
};

export function getIconComponent(iconName: string): LucideIcon | null {
  return iconMap[iconName] || null;
}

export function getAvailableIcons(): Array<{
  name: string;
  component: LucideIcon;
}> {
  return Object.entries(iconMap).map(([name, component]) => ({
    name,
    component,
  }));
}
