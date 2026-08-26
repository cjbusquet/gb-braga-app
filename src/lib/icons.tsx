/* eslint-disable react-refresh/only-export-components */
import {
  faGraduationCap,
  faRightFromBracket,
  faMoneyBillWave,
  faCalendarDays,
  faChartBar,
  faComments,
  faChevronLeft,
  faChevronRight,
  faGear,
  faEuroSign,
  faFileLines,
  faEnvelope,
  faGlobe,
  faHouse,
  faLink,
  faPuzzlePiece,
  faQrcode,
  faTableCells,
  faTrophy,
  faUsers,
  faPencil,
  faVideo,
  faFile,
  faTrash,
  faCheck,
  faXmark,
  faPlus,
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
  faEye,
  faEyeSlash,
  faUserPlus,
  faUserMinus,
  faUser,
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faCircleInfo,
  faBell,
  faPhone,
  faCamera,
  faFileArrowDown,
  faDownload,
  faUpload,
  faPaperPlane,
  faImage,
  faCalendar,
  faClock,
  faLocationDot,
  faStar,
  faHeart,
  faKey,
  faLock,
  faShieldHalved,
  faShareNodes,
  faRotate,
  faEllipsis,
  faBars,
  faFilter,
  faSliders,
  faCirclePlay,
  faCirclePause,
  faCircleStop,
  faPrint,
  faClipboard,
  faClipboardCheck,
  faIdCard,
  faCreditCard,
  faReceipt,
  faBuilding,
  faWifi,
  faSignal,
  faCircleExclamation,
  faBolt,
  faFloppyDisk,
  faMobileScreenButton,
  faMedal,
  faSchool,
  faInbox,
  faBook,
  faCircle,
  faCrown,
  faFlask,
  faSignature,
  faBullhorn,
  faCakeCandles,
  faSquare,
  faDesktop,
  faDumbbell,
  faSackDollar,
  faBan,
  faArrowDown,
  faBriefcase,
  faHandFist,
  faComment,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Ícones FontAwesome (estilo "solid"), re-exportados com os mesmos nomes
 * historicamente usados no projeto (quando ainda era Heroicons), para que os
 * pontos de utilização existentes (`<Ico icon={XxxIcon} />`) continuem a
 * funcionar sem alterações. O FontAwesome free tier não distingue
 * outline/solid da mesma forma que o Heroicons — tudo usa o estilo "solid".
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { CSSProperties } from 'react';

export type HeroIcon = IconDefinition;

export const PencilIcon = faPencil;
export const VideoCameraIcon = faVideo;
export const DocumentIcon = faFile;
export const TrashIcon = faTrash;
export const CheckIcon = faCheck;
export const XMarkIcon = faXmark;
export const PlusIcon = faPlus;
export const ArrowLeftIcon = faArrowLeft;
export const ArrowRightIcon = faArrowRight;
export const ChevronRightIcon = faChevronRight;
export const ChevronLeftIcon = faChevronLeft;
export const ChevronDownIcon = faChevronDown;
export const ChevronUpIcon = faChevronUp;
export const MagnifyingGlassIcon = faMagnifyingGlass;
export const EyeIcon = faEye;
export const EyeSlashIcon = faEyeSlash;
export const UserPlusIcon = faUserPlus;
export const UserMinusIcon = faUserMinus;
export const UserIcon = faUser;
export const UsersIcon = faUsers;
export const CheckCircleIcon = faCircleCheck;
export const XCircleIcon = faCircleXmark;
export const ExclamationTriangleIcon = faTriangleExclamation;
export const InformationCircleIcon = faCircleInfo;
export const BellIcon = faBell;
export const EnvelopeIcon = faEnvelope;
export const PhoneIcon = faPhone;
export const QrCodeIcon = faQrcode;
export const CameraIcon = faCamera;
export const DocumentTextIcon = faFileLines;
export const DocumentArrowDownIcon = faFileArrowDown;
export const ArrowDownTrayIcon = faDownload;
export const ArrowUpTrayIcon = faUpload;
export const PaperAirplaneIcon = faPaperPlane;
export const PhotoIcon = faImage;
export const ChatBubbleLeftRightIcon = faComments;
export const BanknotesIcon = faMoneyBillWave;
export const CurrencyEuroIcon = faEuroSign;
export const TrophyIcon = faTrophy;
export const AcademicCapIcon = faGraduationCap;
export const CalendarDaysIcon = faCalendarDays;
export const CalendarIcon = faCalendar;
export const ClockIcon = faClock;
export const MapPinIcon = faLocationDot;
export const StarIcon = faStar;
export const HeartIcon = faHeart;
export const Cog6ToothIcon = faGear;
export const KeyIcon = faKey;
export const LockClosedIcon = faLock;
export const ShieldCheckIcon = faShieldHalved;
export const GlobeAltIcon = faGlobe;
export const LinkIcon = faLink;
export const ShareIcon = faShareNodes;
export const ArrowPathIcon = faRotate;
export const EllipsisHorizontalIcon = faEllipsis;
export const Bars3Icon = faBars;
export const FunnelIcon = faFilter;
export const AdjustmentsHorizontalIcon = faSliders;
export const Squares2X2Icon = faTableCells;
export const HomeIcon = faHouse;
export const PlayCircleIcon = faCirclePlay;
export const PauseCircleIcon = faCirclePause;
export const StopCircleIcon = faCircleStop;
export const PrinterIcon = faPrint;
export const ClipboardDocumentIcon = faClipboard;
export const ClipboardDocumentCheckIcon = faClipboardCheck;
export const IdentificationIcon = faIdCard;
export const CreditCardIcon = faCreditCard;
export const ReceiptPercentIcon = faReceipt;
export const BuildingOfficeIcon = faBuilding;
export const WifiIcon = faWifi;
export const SignalIcon = faSignal;

/* Adicionados para a substituição de emojis por ícones FontAwesome */
export const BoltIcon = faBolt;
export const SaveIcon = faFloppyDisk;
export const DeviceMobileIcon = faMobileScreenButton;
export const MedalIcon = faMedal;
export const SchoolIcon = faSchool;
export const InboxIcon = faInbox;
export const BookIcon = faBook;
export const CircleIcon = faCircle;
export const CrownIcon = faCrown;
export const FlaskIcon = faFlask;
export const SignatureIcon = faSignature;
export const BullhornIcon = faBullhorn;
export const CakeIcon = faCakeCandles;
export const SquareIcon = faSquare;
export const DesktopIcon = faDesktop;
export const DumbbellIcon = faDumbbell;
export const MoneyBagIcon = faSackDollar;
export const BanIcon = faBan;
export const ArrowDownIcon = faArrowDown;
export const BriefcaseIcon = faBriefcase;
export const MartialArtsIcon = faHandFist;
export const CommentIcon = faComment;

/* Usadas apenas em Layout.tsx (barra lateral) */
export const ArrowRightOnRectangleIcon = faRightFromBracket;
export const ChartBarIcon = faChartBar;
export const PuzzlePieceIcon = faPuzzlePiece;

/* Variantes "solid" — mantidas por compatibilidade; no FontAwesome free
   tier já correspondem ao mesmo ícone que a variante base acima. */
export const CheckCircleSolidIcon = faCircleCheck;
export const XCircleSolidIcon = faCircleXmark;
export const ExclamationCircleSolidIcon = faCircleExclamation;
export const StarSolidIcon = faStar;

/** Wrapper para ícone inline em botão. Uso: <Ico icon={PencilIcon} sm /> */
interface IcoProps {
  icon: IconDefinition;
  sm?: boolean;
  lg?: boolean;
  className?: string;
  style?: CSSProperties;
}
export function Ico({ icon, sm, lg, className, style }: IcoProps) {
  const size = sm ? 13 : lg ? 18 : 15;
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      style={{ width: size, height: size, flexShrink: 0, ...style }}
    />
  );
}
