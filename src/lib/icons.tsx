import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationCircleIcon as ExclamationCircleSolidIcon,
  StarIcon as StarSolidIcon,
  XCircleIcon as XCircleSolidIcon,
} from '@heroicons/react/24/solid';

/**
 * Re-exports de Heroicons com tamanhos standard para uso nas páginas.
 * Tamanho botão: 14×14 (sm) | 16×16 (md) | 18×18 (lg)
 */
import type { SVGProps } from 'react';

export type HeroIcon = React.ComponentType<SVGProps<SVGSVGElement>>;

export {
  PencilIcon,
  VideoCameraIcon,
  DocumentIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  QrCodeIcon,
  CameraIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  CurrencyEuroIcon,
  TrophyIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  Cog6ToothIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LinkIcon,
  ShareIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  Bars3Icon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  HomeIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  StopCircleIcon,
  PrinterIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  BuildingOfficeIcon,
  WifiIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

export {
  CheckCircleSolidIcon,
  XCircleSolidIcon,
  ExclamationCircleSolidIcon,
  StarSolidIcon,
};

/** Wrapper para ícone inline em botão. Uso: <Ico icon={PencilIcon} sm /> */
interface IcoProps extends SVGProps<SVGSVGElement> {
  icon: HeroIcon;
  sm?: boolean;
  lg?: boolean;
}
export function Ico({ icon: Icon, sm, lg, style, ...rest }: IcoProps) {
  const size = sm ? 13 : lg ? 18 : 15;
  return (
    <Icon
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      {...rest}
    />
  );
}
