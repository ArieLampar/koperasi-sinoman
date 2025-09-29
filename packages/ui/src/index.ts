// =============================================================================
// KOPERASI SINOMAN UI LIBRARY - MAIN EXPORTS
// =============================================================================

// -----------------------------------------------------------------------------
// BASE UI COMPONENTS (Radix UI Primitives & Core Components)
// -----------------------------------------------------------------------------

// Form & Input Components
export {
  Button,
  type ButtonProps,
  buttonVariants,
} from './components/ui/button'

export {
  Input,
  type InputProps,
} from './components/ui/input'

export {
  Label,
  type LabelProps,
} from './components/ui/label'

export {
  Textarea,
  type TextareaProps,
} from './components/ui/textarea'

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  type SelectProps,
} from './components/ui/select'

export {
  Checkbox,
  type CheckboxProps,
} from './components/ui/checkbox'

export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
} from './components/ui/radio-group'

export {
  Switch,
  type SwitchProps,
} from './components/ui/switch'

export {
  Slider,
  type SliderProps,
} from './components/ui/slider'

// Layout & Container Components
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from './components/ui/card'

export {
  Container,
  type ContainerProps,
} from './components/ui/container'

export {
  Grid,
  GridItem,
  type GridProps,
} from './components/ui/grid'

export {
  Flex,
  type FlexProps,
} from './components/ui/flex'

export {
  Stack,
  VStack,
  HStack,
  type StackProps,
} from './components/ui/stack'

export {
  Separator,
  type SeparatorProps,
} from './components/ui/separator'

// Navigation & Overlay Components
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  type DialogProps,
} from './components/ui/dialog'

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
} from './components/ui/alert-dialog'

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  type SheetProps,
} from './components/ui/sheet'

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from './components/ui/dropdown-menu'

export {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverProps,
} from './components/ui/popover'

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipProps,
} from './components/ui/tooltip'

export {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  type MenubarProps,
} from './components/ui/menubar'

// Data Display Components
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps,
} from './components/ui/table'

export {
  DataTable,
  type DataTableProps,
  type ColumnDef,
} from './components/ui/data-table'

export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarProps,
} from './components/ui/avatar'

export {
  Badge,
  badgeVariants,
  type BadgeProps,
} from './components/ui/badge'

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
} from './components/ui/accordion'

export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsProps,
} from './components/ui/tabs'

export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleProps,
} from './components/ui/collapsible'

// Feedback Components
export {
  Alert,
  AlertDescription,
  AlertTitle,
  type AlertProps,
} from './components/ui/alert'

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from './components/ui/toast'

export {
  Progress,
  type ProgressProps,
} from './components/ui/progress'

export {
  Skeleton,
  type SkeletonProps,
} from './components/ui/skeleton'

export {
  Spinner,
  type SpinnerProps,
} from './components/ui/spinner'

export {
  LoadingDots,
  type LoadingDotsProps,
} from './components/ui/loading-dots'

// Media Components
export {
  AspectRatio,
  type AspectRatioProps,
} from './components/ui/aspect-ratio'

export {
  Image,
  type ImageProps,
} from './components/ui/image'

// Command & Search Components
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  type CommandProps,
} from './components/ui/command'

export {
  Calendar,
  type CalendarProps,
} from './components/ui/calendar'

export {
  DatePicker,
  type DatePickerProps,
} from './components/ui/date-picker'

// -----------------------------------------------------------------------------
// FORM COMPONENTS & UTILITIES
// -----------------------------------------------------------------------------

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  type FormProps,
} from './components/form/form'

export {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  FormDatePicker,
  FormCombobox,
  type FormInputProps,
  type FormTextareaProps,
  type FormSelectProps,
  type FormCheckboxProps,
  type FormRadioGroupProps,
  type FormDatePickerProps,
  type FormComboboxProps,
} from './components/form/form-fields'

export {
  FormSection,
  FormGrid,
  FormRow,
  FormActions,
  type FormSectionProps,
  type FormGridProps,
  type FormRowProps,
  type FormActionsProps,
} from './components/form/form-layout'

export {
  SearchInput,
  SearchCombobox,
  FilterSelect,
  DateRangePicker,
  type SearchInputProps,
  type SearchComboboxProps,
  type FilterSelectProps,
  type DateRangePickerProps,
} from './components/form/search-components'

// -----------------------------------------------------------------------------
// ADMIN COMPONENTS (Dashboard & Administrative UI)
// -----------------------------------------------------------------------------

export {
  AdminButton,
  adminButtonVariants,
  type AdminButtonProps,
} from './components/admin/admin-button'

export {
  AdminCard,
  AdminCardHeader,
  AdminCardContent,
  AdminCardFooter,
  type AdminCardProps,
} from './components/admin/admin-card'

export {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  type AdminTableProps,
} from './components/admin/admin-table'

export {
  AdminForm,
  AdminFormSection,
  AdminFormField,
  AdminFormActions,
  type AdminFormProps,
} from './components/admin/admin-form'

export {
  AdminLayout,
  AdminMain,
  AdminContent,
  type AdminLayoutProps,
} from './components/admin/admin-layout'

export {
  AdminSidebar,
  AdminSidebarItem,
  AdminSidebarGroup,
  AdminSidebarCollapse,
  type AdminSidebarProps,
} from './components/admin/admin-sidebar'

export {
  AdminHeader,
  AdminHeaderTitle,
  AdminHeaderActions,
  AdminHeaderUser,
  type AdminHeaderProps,
} from './components/admin/admin-header'

export {
  MetricCard,
  MetricCardValue,
  MetricCardLabel,
  MetricCardTrend,
  MetricCardIcon,
  type MetricCardProps,
} from './components/admin/metric-card'

export {
  StatusIndicator,
  statusIndicatorVariants,
  type StatusIndicatorProps,
} from './components/admin/status-indicator'

export {
  AdminDataTable,
  type AdminDataTableProps,
} from './components/admin/admin-data-table'

export {
  LoadingScreen,
  type LoadingScreenProps,
} from './components/admin/loading-screen'

export {
  AccessDenied,
  type AccessDeniedProps,
} from './components/admin/access-denied'

export {
  BulkActions,
  type BulkActionsProps,
} from './components/admin/bulk-actions'

export {
  FilterPanel,
  type FilterPanelProps,
} from './components/admin/filter-panel'

export {
  ExportButton,
  type ExportButtonProps,
} from './components/admin/export-button'

// -----------------------------------------------------------------------------
// SUPERAPP COMPONENTS (Mobile-First Experience)
// -----------------------------------------------------------------------------

export {
  SuperappButton,
  superappButtonVariants,
  type SuperappButtonProps,
} from './components/superapp/superapp-button'

export {
  SuperappCard,
  SuperappCardHeader,
  SuperappCardContent,
  SuperappCardFooter,
  type SuperappCardProps,
} from './components/superapp/superapp-card'

export {
  BottomNavigation,
  BottomNavigationItem,
  type BottomNavigationProps,
} from './components/superapp/bottom-navigation'

export {
  SuperappHeader,
  SuperappHeaderTitle,
  SuperappHeaderBack,
  SuperappHeaderActions,
  type SuperappHeaderProps,
} from './components/superapp/superapp-header'

export {
  FeatureCard,
  FeatureCardIcon,
  FeatureCardTitle,
  FeatureCardDescription,
  type FeatureCardProps,
} from './components/superapp/feature-card'

export {
  FloatingActionButton,
  type FloatingActionButtonProps,
} from './components/superapp/floating-action-button'

export {
  PullToRefresh,
  type PullToRefreshProps,
} from './components/superapp/pull-to-refresh'

export {
  NotificationBanner,
  type NotificationBannerProps,
} from './components/superapp/notification-banner'

export {
  QuickActions,
  QuickActionItem,
  type QuickActionsProps,
} from './components/superapp/quick-actions'

export {
  TabBar,
  TabBarItem,
  type TabBarProps,
} from './components/superapp/tab-bar'

export {
  SwipeableCard,
  type SwipeableCardProps,
} from './components/superapp/swipeable-card'

export {
  ActionSheet,
  ActionSheetItem,
  ActionSheetCancel,
  type ActionSheetProps,
} from './components/superapp/action-sheet'

// -----------------------------------------------------------------------------
// LAYOUT & NAVIGATION COMPONENTS
// -----------------------------------------------------------------------------

export {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
  type SidebarProps,
} from './components/layout/sidebar'

export {
  Header,
  HeaderContent,
  HeaderTitle,
  HeaderActions,
  HeaderUser,
  type HeaderProps,
} from './components/layout/header'

export {
  Navigation,
  NavigationItem,
  NavigationGroup,
  NavigationCollapse,
  type NavigationProps,
} from './components/layout/navigation'

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  type BreadcrumbProps,
} from './components/layout/breadcrumb'

export {
  PageContainer,
  PageHeader,
  PageContent,
  PageFooter,
  type PageContainerProps,
} from './components/layout/page-container'

export {
  Section,
  SectionHeader,
  SectionContent,
  SectionFooter,
  type SectionProps,
} from './components/layout/section'

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS & HELPERS
// -----------------------------------------------------------------------------

// Core utilities
export {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  truncateText,
  capitalizeWords,
  sleep,
  generateId,
  debounce,
  throttle,
  isEmpty,
  deepClone,
  isBrowser,
  getInitials,
  isValidPhoneNumber,
  isValidNIK,
  formatPhoneNumber,
  calculateAge,
} from './lib/utils'

// Class name utility (re-export for convenience)
export { cn as clsx } from './lib/cn'

// Form validation utilities
export {
  validateEmail,
  validatePhone,
  validateNIK,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
  validateDate,
  createValidator,
  type ValidationRule,
  type ValidationResult,
} from './lib/validation'

// Date utilities
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  parseDate,
  isValidDate,
  addDays,
  subtractDays,
  getDaysBetween,
  getMonthName,
  getWeekdayName,
  type DateFormat,
} from './lib/date'

// Number and currency utilities
export {
  parseNumber,
  formatFileSize,
  formatDistance,
  formatDuration,
  percentage,
  roundToDecimal,
  clamp,
  random,
  randomInt,
} from './lib/number'

// String utilities
export {
  slugify,
  camelCase,
  pascalCase,
  kebabCase,
  snakeCase,
  removeAccents,
  highlight,
  excerpt,
  wordCount,
  readingTime,
} from './lib/string'

// Array utilities
export {
  unique,
  groupBy,
  sortBy,
  chunk,
  shuffle,
  sample,
  flatten,
  intersection,
  difference,
  union,
} from './lib/array'

// Object utilities
export {
  pick,
  omit,
  merge,
  get,
  set,
  has,
  mapKeys,
  mapValues,
  invert,
} from './lib/object'

// -----------------------------------------------------------------------------
// CUSTOM HOOKS
// -----------------------------------------------------------------------------

// UI State Hooks
export {
  useToast,
  type ToastOptions,
} from './hooks/use-toast'

export {
  useLocalStorage,
  useSessionStorage,
} from './hooks/use-storage'

export {
  useDebounce,
  useThrottle,
} from './hooks/use-timing'

export {
  useMediaQuery,
  useBreakpoint,
} from './hooks/use-media-query'

export {
  useClickOutside,
  useEscapeKey,
  useKeyboardShortcut,
} from './hooks/use-interactions'

export {
  useIntersectionObserver,
  useResizeObserver,
  useMutationObserver,
} from './hooks/use-observers'

export {
  useCopyToClipboard,
  useClipboard,
} from './hooks/use-clipboard'

export {
  useAsync,
  useAsyncCallback,
  useAsyncMemo,
} from './hooks/use-async'

export {
  usePrevious,
  useCounter,
  useToggle,
  useBoolean,
  useSet,
  useMap,
} from './hooks/use-state'

export {
  useForm,
  useFormField,
  useFormValidation,
  type FormOptions,
  type FieldOptions,
} from './hooks/use-form'

export {
  useTable,
  usePagination,
  useSorting,
  useFiltering,
  type TableOptions,
} from './hooks/use-table'

// Business Logic Hooks
export {
  useCurrency,
  useNumberFormat,
  usePercentage,
} from './hooks/use-formatting'

export {
  useApi,
  useQuery,
  useMutation,
  type ApiOptions,
} from './hooks/use-api'

export {
  useAuth,
  usePermissions,
  type AuthState,
} from './hooks/use-auth'

export {
  useNotifications,
  type NotificationOptions,
} from './hooks/use-notifications'

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

// Component types
export type {
  ComponentProps,
  VariantProps,
  AsProps,
  PolymorphicProps,
  ColorScheme,
  Size,
  Variant,
} from './types/component-types'

// Form types
export type {
  FormFieldProps,
  FormValidation,
  FormState,
  FormErrors,
  FieldConfig,
  ValidationSchema,
} from './types/form-types'

// Table types
export type {
  TableData,
  TableColumn,
  TableRow,
  SortDirection,
  FilterOperator,
  PaginationState,
} from './types/table-types'

// Theme types
export type {
  Theme,
  ColorMode,
  ThemeConfig,
  ColorPalette,
  Typography,
  Spacing,
  Breakpoints,
} from './types/theme-types'

// Utility types
export type {
  Optional,
  Required,
  Nullable,
  NonNullable,
  DeepPartial,
  DeepRequired,
  ValueOf,
  KeyOf,
  Entries,
  UnionToIntersection,
  PickByType,
  OmitByType,
} from './types/utility-types'

// Data types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  SearchParams,
  SortParams,
  FilterParams,
} from './types/data-types'

// Event types
export type {
  EventHandler,
  ChangeHandler,
  ClickHandler,
  FocusHandler,
  KeyHandler,
  MouseHandler,
  TouchHandler,
} from './types/event-types'

// -----------------------------------------------------------------------------
// CONSTANTS & CONFIGURATIONS
// -----------------------------------------------------------------------------

export {
  BREAKPOINTS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  ANIMATIONS,
  Z_INDEX,
} from './constants/design-tokens'

export {
  ADMIN_ROUTES,
  SUPERAPP_ROUTES,
  API_ENDPOINTS,
} from './constants/routes'

export {
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants/messages'

export {
  DEFAULT_PAGINATION,
  TABLE_SIZES,
  SORT_DIRECTIONS,
  FILTER_OPERATORS,
} from './constants/table'

// -----------------------------------------------------------------------------
// STYLES (Import separately)
// -----------------------------------------------------------------------------
// To use styles in your application:
// import '@koperasi-sinoman/ui/styles'

// To extend Tailwind config:
// const uiConfig = require('@koperasi-sinoman/ui/tailwind')

// -----------------------------------------------------------------------------
// CONVENIENCE RE-EXPORTS
// -----------------------------------------------------------------------------

// All UI components (for backwards compatibility)
export * as UI from './components/ui'
export * as Admin from './components/admin'
export * as Superapp from './components/superapp'
export * as Layout from './components/layout'
export * as Form from './components/form'

// All utilities
export * as Utils from './lib/utils'
export * as Hooks from './hooks'
export * as Types from './types'