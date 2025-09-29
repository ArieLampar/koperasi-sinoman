SINOMAN SUPERAPP - COMPLETE DESIGN SYSTEM DOCUMENTATION

1️⃣ DESIGN TOKEN SYSTEM

🎨 COLOR TOKENS

javascript// design-tokens/colors.js

export const colors = {

// Primary Palette - Emerald

primary: {

50: \'#ecfdf5\',

100: \'#d1fae5\',

200: \'#a7f3d0\',

300: \'#6ee7b7\',

400: \'#34d399\',

500: \'#10b981\',

600: \'#059669\', // Main Primary

700: \'#047857\',

800: \'#065f46\',

900: \'#064e3b\',

},

// Secondary Palette - Amber

secondary: {

50: \'#fffbeb\',

100: \'#fef3c7\',

200: \'#fde68a\',

300: \'#fcd34d\',

400: \'#fbbf24\',

500: \'#f59e0b\', // Main Secondary

600: \'#d97706\',

700: \'#b45309\',

800: \'#92400e\',

900: \'#78350f\',

},

// Semantic Colors

semantic: {

success: \'#10b981\',

warning: \'#f59e0b\',

error: \'#ef4444\',

info: \'#3b82f6\',

},

// Neutral Palette

neutral: {

0: \'#ffffff\',

50: \'#f9fafb\',

100: \'#f3f4f6\',

200: \'#e5e7eb\',

300: \'#d1d5db\',

400: \'#9ca3af\',

500: \'#6b7280\',

600: \'#4b5563\',

700: \'#374151\',

800: \'#1f2937\',

900: \'#111827\',

1000: \'#000000\',

},

// Background Colors

background: {

primary: \'#ffffff\',

secondary: \'#f9fafb\',

tertiary: \'#f3f4f6\',

inverse: \'#1f2937\',

overlay: \'rgba(0, 0, 0, 0.5)\',

glass: \'rgba(255, 255, 255, 0.8)\',

},

// Text Colors

text: {

primary: \'#1f2937\',

secondary: \'#6b7280\',

tertiary: \'#9ca3af\',

disabled: \'#d1d5db\',

inverse: \'#ffffff\',

link: \'#059669\',

error: \'#ef4444\',

success: \'#10b981\',

},

// Border Colors

border: {

default: \'#e5e7eb\',

focus: \'#059669\',

error: \'#ef4444\',

subtle: \'#f3f4f6\',

strong: \'#9ca3af\',

},

// Surface Colors

surface: {

card: \'#ffffff\',

elevated: \'#ffffff\',

sunken: \'#f9fafb\',

overlay: \'rgba(0, 0, 0, 0.05)\',

},

// Special Colors

special: {

goldMember: \'#f59e0b\',

silverMember: \'#9ca3af\',

bronzeMember: \'#d97706\',

fitChallenge: \'#ff6b6b\',

bankSampah: \'#22c55e\',

}

};

📏 SPACING TOKENS

javascript// design-tokens/spacing.js

export const spacing = {

// Base unit: 4px

px: \'1px\',

0: \'0px\',

0.5: \'2px\', // 0.125rem

1: \'4px\', // 0.25rem - Base unit

1.5: \'6px\', // 0.375rem

2: \'8px\', // 0.5rem

2.5: \'10px\', // 0.625rem

3: \'12px\', // 0.75rem

3.5: \'14px\', // 0.875rem

4: \'16px\', // 1rem - Default padding

5: \'20px\', // 1.25rem

6: \'24px\', // 1.5rem - Section spacing

7: \'28px\', // 1.75rem

8: \'32px\', // 2rem

9: \'36px\', // 2.25rem

10: \'40px\', // 2.5rem

11: \'44px\', // 2.75rem

12: \'48px\', // 3rem - Component height

14: \'56px\', // 3.5rem - FAB size

16: \'64px\', // 4rem - Nav height

20: \'80px\', // 5rem

24: \'96px\', // 6rem

28: \'112px\', // 7rem

32: \'128px\', // 8rem

// Component-specific spacing

component: {

buttonPaddingX: \'24px\',

buttonPaddingY: \'12px\',

inputPaddingX: \'16px\',

inputPaddingY: \'12px\',

cardPadding: \'16px\',

sectionGap: \'24px\',

screenPadding: \'16px\',

bottomNavHeight: \'64px\',

},

// Layout spacing

layout: {

containerMaxWidth: \'428px\', // iPhone 14 Pro Max

gridGap: \'16px\',

stackGap: \'12px\',

inlineGap: \'8px\',

}

};

📝 TYPOGRAPHY TOKENS

javascript// design-tokens/typography.js

export const typography = {

// Font Families

fontFamily: {

sans: \[\'Inter\', \'-apple-system\', \'BlinkMacSystemFont\', \'Segoe
UI\', \'Roboto\', \'sans-serif\'\],

mono: \[\'JetBrains Mono\', \'SF Mono\', \'Monaco\', \'monospace\'\],

},

// Font Sizes

fontSize: {

\'2xs\': \'10px\', // 0.625rem - Micro text

xs: \'12px\', // 0.75rem - Captions

sm: \'14px\', // 0.875rem - Small text

base: \'16px\', // 1rem - Body text

lg: \'18px\', // 1.125rem - Large body

xl: \'20px\', // 1.25rem - Heading 6

\'2xl\': \'24px\', // 1.5rem - Heading 5

\'3xl\': \'30px\', // 1.875rem - Heading 4

\'4xl\': \'36px\', // 2.25rem - Heading 3

\'5xl\': \'48px\', // 3rem - Heading 2

\'6xl\': \'60px\', // 3.75rem - Heading 1

},

// Font Weights

fontWeight: {

thin: \'100\',

extralight: \'200\',

light: \'300\',

regular: \'400\',

medium: \'500\',

semibold: \'600\',

bold: \'700\',

extrabold: \'800\',

black: \'900\',

},

// Line Heights

lineHeight: {

none: \'1\',

tight: \'1.25\',

snug: \'1.375\',

normal: \'1.5\',

relaxed: \'1.625\',

loose: \'2\',

},

// Letter Spacing

letterSpacing: {

tighter: \'-0.05em\',

tight: \'-0.025em\',

normal: \'0em\',

wide: \'0.025em\',

wider: \'0.05em\',

widest: \'0.1em\',

},

// Text Styles (Composed)

textStyles: {

// Headings

h1: {

fontSize: \'36px\',

fontWeight: \'700\',

lineHeight: \'1.25\',

letterSpacing: \'-0.025em\',

},

h2: {

fontSize: \'30px\',

fontWeight: \'700\',

lineHeight: \'1.3\',

letterSpacing: \'-0.025em\',

},

h3: {

fontSize: \'24px\',

fontWeight: \'600\',

lineHeight: \'1.375\',

letterSpacing: \'0em\',

},

h4: {

fontSize: \'20px\',

fontWeight: \'600\',

lineHeight: \'1.4\',

letterSpacing: \'0em\',

},

h5: {

fontSize: \'18px\',

fontWeight: \'600\',

lineHeight: \'1.5\',

letterSpacing: \'0em\',

},

h6: {

fontSize: \'16px\',

fontWeight: \'600\',

lineHeight: \'1.5\',

letterSpacing: \'0em\',

},

// Body

bodyLarge: {

fontSize: \'18px\',

fontWeight: \'400\',

lineHeight: \'1.625\',

},

bodyBase: {

fontSize: \'16px\',

fontWeight: \'400\',

lineHeight: \'1.5\',

},

bodySmall: {

fontSize: \'14px\',

fontWeight: \'400\',

lineHeight: \'1.5\',

},

// UI Elements

button: {

fontSize: \'16px\',

fontWeight: \'600\',

lineHeight: \'1\',

letterSpacing: \'0.025em\',

textTransform: \'none\',

},

caption: {

fontSize: \'12px\',

fontWeight: \'400\',

lineHeight: \'1.375\',

},

overline: {

fontSize: \'12px\',

fontWeight: \'600\',

lineHeight: \'1.5\',

letterSpacing: \'0.1em\',

textTransform: \'uppercase\',

},

label: {

fontSize: \'14px\',

fontWeight: \'500\',

lineHeight: \'1.375\',

},

}

};

🔲 OTHER DESIGN TOKENS

javascript// design-tokens/effects.js

export const effects = {

// Border Radius

borderRadius: {

none: \'0px\',

sm: \'4px\',

base: \'8px\',

md: \'12px\',

lg: \'16px\',

xl: \'24px\',

\'2xl\': \'32px\',

full: \'9999px\',

},

// Shadows

boxShadow: {

none: \'none\',

xs: \'0 1px 2px 0 rgba(0, 0, 0, 0.05)\',

sm: \'0 1px 3px 0 rgba(0, 0, 0, 0.1)\',

base: \'0 4px 6px -1px rgba(0, 0, 0, 0.1)\',

md: \'0 10px 15px -3px rgba(0, 0, 0, 0.1)\',

lg: \'0 20px 25px -5px rgba(0, 0, 0, 0.1)\',

xl: \'0 25px 50px -12px rgba(0, 0, 0, 0.25)\',

inner: \'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)\',

},

// Transitions

transition: {

none: \'none\',

all: \'all 150ms cubic-bezier(0.4, 0, 0.2, 1)\',

fast: \'all 100ms cubic-bezier(0.4, 0, 0.2, 1)\',

base: \'all 200ms cubic-bezier(0.4, 0, 0.2, 1)\',

slow: \'all 300ms cubic-bezier(0.4, 0, 0.2, 1)\',

slower: \'all 500ms cubic-bezier(0.4, 0, 0.2, 1)\',

},

// Z-Index

zIndex: {

0: \'0\',

10: \'10\',

20: \'20\',

30: \'30\',

40: \'40\',

50: \'50\',

dropdown: \'1000\',

sticky: \'1020\',

modal: \'1030\',

popover: \'1040\',

tooltip: \'1050\',

notification: \'1060\',

},

// Opacity

opacity: {

0: \'0\',

5: \'0.05\',

10: \'0.1\',

20: \'0.2\',

25: \'0.25\',

30: \'0.3\',

40: \'0.4\',

50: \'0.5\',

60: \'0.6\',

70: \'0.7\',

75: \'0.75\',

80: \'0.8\',

90: \'0.9\',

95: \'0.95\',

100: \'1\',

}

};

2️⃣ USER FLOW DIAGRAM (MERMAID)

mermaidgraph TB

%% App Entry Points

Start(\[App Launch\]) \--\> SplashScreen\[Splash Screen\<br/\>2
seconds\]

SplashScreen \--\> AuthCheck{User\<br/\>Authenticated?}

%% Authentication Flow

AuthCheck \--\>\|No\| FirstTime{First Time\<br/\>User?}

AuthCheck \--\>\|Yes\| Dashboard\[Dashboard Home\]

FirstTime \--\>\|Yes\| Onboarding1\[Onboarding 1\<br/\>Manfaat
Koperasi\]

FirstTime \--\>\|No\| LoginScreen\[Super Login\]

Onboarding1 \--\> Onboarding2\[Onboarding 2\<br/\>Fit Challenge\]

Onboarding2 \--\> Onboarding3\[Onboarding 3\<br/\>Poin System\]

Onboarding3 \--\> RegOptions\[Registration Options\]

RegOptions \--\>\|Koperasi Only\| RegKoperasi\[Register
Koperasi\<br/\>Step 1-3\]

RegOptions \--\>\|Combo Package\| RegCombo\[Register Combo\]

RegOptions \--\>\|Already Member\| LoginScreen

RegKoperasi \--\> Payment\[Payment Gateway\]

RegCombo \--\> Payment

Payment \--\> PaymentStatus{Payment\<br/\>Success?}

PaymentStatus \--\>\|Yes\| OTPVerify\[OTP Verification\]

PaymentStatus \--\>\|No\| PaymentRetry\[Retry Payment\]

PaymentRetry \--\> Payment

OTPVerify \--\> Dashboard

LoginScreen \--\>\|Login\| LoginAuth{Credentials\<br/\>Valid?}

LoginScreen \--\>\|Register\| RegOptions

LoginScreen \--\>\|Forgot\| ForgotPassword\[Reset Password\]

LoginAuth \--\>\|Yes\| Dashboard

LoginAuth \--\>\|No\| LoginError\[Show Error\]

LoginError \--\> LoginScreen

ForgotPassword \--\> OTPReset\[OTP for Reset\]

OTPReset \--\> NewPassword\[Set New Password\]

NewPassword \--\> LoginScreen

%% Main Dashboard Hub

Dashboard \--\>\|Bottom Nav\| MainFeatures{Choose\<br/\>Feature}

MainFeatures \--\>\|Savings\| SavingsFlow\[Savings Overview\]

MainFeatures \--\>\|Market\| Marketplace\[Marketplace Lite\]

MainFeatures \--\>\|Fit\| FitChallenge\[Fit Challenge Hub\]

MainFeatures \--\>\|QR\| QRScanner\[QR Universal\]

MainFeatures \--\>\|Profile\| ProfileSettings\[Profile Settings\]

MainFeatures \--\>\|Activity\| TransactionList\[Transaction History\]

MainFeatures \--\>\|Notif\| NotificationCenter\[Notifications\]

%% Savings Flow

SavingsFlow \--\>\|Top Up\| TopUpModal\[Top Up Sheet\]

SavingsFlow \--\>\|Withdraw\| WithdrawModal\[Withdraw Request\]

SavingsFlow \--\>\|History\| TransactionList

TopUpModal \--\>\|Select Amount\| PaymentMethod1\[Payment Selection\]

PaymentMethod1 \--\> ProcessPayment1\[Process Payment\]

ProcessPayment1 \--\> PaymentSuccess1{Success?}

PaymentSuccess1 \--\>\|Yes\| UpdateBalance\[Update Balance\]

PaymentSuccess1 \--\>\|No\| TopUpModal

UpdateBalance \--\> SavingsFlow

WithdrawModal \--\>\|Request\| WithdrawProcess\[Process Request\]

WithdrawProcess \--\> WithdrawStatus\[Show Status\]

WithdrawStatus \--\> SavingsFlow

%% Marketplace Flow

Marketplace \--\>\|Browse\| ProductGrid\[Product Grid\]

ProductGrid \--\>\|Search\| SearchResults\[Search Results\]

ProductGrid \--\>\|Filter\| FilterModal\[Filter Options\]

ProductGrid \--\>\|Product\| ProductDetail\[Product Detail Sheet\]

ProductDetail \--\>\|Add Cart\| ShoppingCart\[Shopping Cart\]

ProductDetail \--\>\|Buy Now\| CheckoutFlow\[Checkout\]

ShoppingCart \--\> CheckoutFlow

CheckoutFlow \--\>\|Address\| AddressSelect\[Select Address\]

CheckoutFlow \--\>\|Payment\| PaymentMethod2\[Payment Method\]

PaymentMethod2 \--\> ProcessPayment2\[Process Order\]

ProcessPayment2 \--\> OrderConfirm\[Order Confirmation\]

OrderConfirm \--\> OrderTracking\[Track Order\]

%% Fit Challenge Flow

FitChallenge \--\>\|Check In\| DailyCheckin\[Daily Tasks\]

FitChallenge \--\>\|Photos\| ProgressPhotos\[Upload Photos\]

FitChallenge \--\>\|Leaderboard\| LeaderboardFull\[Full Rankings\]

FitChallenge \--\>\|Workout\| WorkoutLibrary\[Video Library\]

FitChallenge \--\>\|Meal\| MealPlan\[Meal Plans\]

DailyCheckin \--\>\|Complete\| EarnPoints\[Points Earned\]

ProgressPhotos \--\>\|Upload\| PhotoCompare\[Before/After\]

EarnPoints \--\> FitChallenge

PhotoCompare \--\> FitChallenge

%% QR Flow

QRScanner \--\>\|Scan Mode\| ScanQR\[Scan QR Code\]

QRScanner \--\>\|My QR\| DisplayQR\[Show Member QR\]

ScanQR \--\>\|Detected\| QRAction{QR Type?}

QRAction \--\>\|Payment\| PaymentQR\[Payment Flow\]

QRAction \--\>\|Member\| MemberProfile\[View Profile\]

QRAction \--\>\|Product\| ProductDetail

QRAction \--\>\|Event\| EventCheckin\[Check In\]

PaymentQR \--\> ProcessPayment3\[Process QR Payment\]

ProcessPayment3 \--\> Dashboard

%% Profile Flow

ProfileSettings \--\>\|Edit\| EditProfile\[Edit Profile\]

ProfileSettings \--\>\|Card\| DigitalCard\[Member Card\]

ProfileSettings \--\>\|Settings\| SettingsMenu\[Settings List\]

ProfileSettings \--\>\|Help\| HelpCenter\[Help & FAQ\]

ProfileSettings \--\>\|Logout\| LogoutConfirm\[Confirm Logout\]

LogoutConfirm \--\>\|Yes\| LoginScreen

LogoutConfirm \--\>\|No\| ProfileSettings

EditProfile \--\>\|Save\| ProfileSettings

DigitalCard \--\>\|Display\| QRFullscreen\[Fullscreen QR\]

QRFullscreen \--\>\|Close\| ProfileSettings

%% Transaction Flow

TransactionList \--\>\|Filter\| TransFilter\[Filter Options\]

TransactionList \--\>\|Detail\| TransDetail\[Transaction Detail\]

TransactionList \--\>\|Export\| ExportPDF\[Download PDF\]

TransDetail \--\>\|Receipt\| EReceipt\[Digital Receipt\]

TransDetail \--\>\|Share\| ShareReceipt\[Share Options\]

%% Error States

Dashboard \--\>\|No Internet\| OfflineMode\[Offline Mode\]

Dashboard \--\>\|Error\| ErrorState\[Error Handler\]

OfflineMode \--\>\|Reconnect\| Dashboard

ErrorState \--\>\|Retry\| Dashboard

%% Success States

UpdateBalance \--\>\|Success\| SuccessToast\[Success Message\]

OrderConfirm \--\>\|Success\| SuccessToast

EarnPoints \--\>\|Success\| SuccessToast

SuccessToast \--\> Dashboard

3️⃣ COMPONENT INVENTORY

markdown# 📦 COMPONENT INVENTORY WITH COUNTS

\## ATOMS (Basic Elements)

\| Component \| Variants \| Count \| Usage \|

\|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|

\| \*\*Button\*\* \| Primary, Secondary, Ghost, Danger, Disabled \| 45
\| All screens \|

\| \*\*Input\*\* \| Text, Password, Number, Search, OTP \| 28 \| Forms,
Search \|

\| \*\*Icon\*\* \| 24px, 20px, 16px \| 150+ \| Throughout \|

\| \*\*Label\*\* \| Default, Required, Error \| 35 \| Forms \|

\| \*\*Badge\*\* \| Number, Dot, Status \| 22 \| Nav, Cards \|

\| \*\*Avatar\*\* \| Small, Medium, Large \| 12 \| Profile, Comments \|

\| \*\*Checkbox\*\* \| Default, Checked, Disabled \| 18 \| Forms, Lists
\|

\| \*\*Radio\*\* \| Default, Selected, Disabled \| 8 \| Options \|

\| \*\*Toggle\*\* \| On, Off, Disabled \| 6 \| Settings \|

\| \*\*Chip\*\* \| Default, Selected, Removable \| 24 \| Filters \|

\## MOLECULES (Composed Components)

\| Component \| Variants \| Count \| Usage \|

\|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|

\| \*\*Card\*\* \| Balance, Product, Transaction, Promo \| 35 \| Lists,
Grids \|

\| \*\*List Item\*\* \| Default, With Icon, With Action \| 48 \| Menus,
History \|

\| \*\*Form Field\*\* \| Input + Label + Error \| 28 \| All forms \|

\| \*\*Tab Bar\*\* \| 2-5 tabs \| 8 \| Navigation \|

\| \*\*Search Bar\*\* \| With Filter, With Voice \| 4 \| Market, Trans
\|

\| \*\*Notification Item\*\* \| Unread, Read, With Action \| 25 \| Notif
Center \|

\| \*\*Product Card\*\* \| Grid, List, Wishlist \| 30 \| Marketplace \|

\| \*\*Transaction Row\*\* \| Deposit, Withdrawal, Purchase \| 50+ \|
History \|

\| \*\*Progress Bar\*\* \| Linear, Circular \| 6 \| Fit, Loading \|

\| \*\*Rating\*\* \| Display, Input \| 8 \| Products \|

\## ORGANISMS (Complex Components)

\| Component \| Variants \| Count \| Usage \|

\|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|

\| \*\*Header\*\* \| Default, With Back, With Actions \| 10 \| All
screens \|

\| \*\*Bottom Navigation\*\* \| 5 items with center QR \| 1 \| Global \|

\| \*\*Bottom Sheet\*\* \| Default, Full Height \| 12 \| Modals \|

\| \*\*Modal\*\* \| Alert, Confirm, Custom \| 8 \| Dialogs \|

\| \*\*Carousel\*\* \| Auto-play, Manual \| 3 \| Dashboard \|

\| \*\*Calendar\*\* \| Date Picker, Range \| 2 \| Booking \|

\| \*\*Image Picker\*\* \| Camera, Gallery \| 4 \| Upload \|

\| \*\*OTP Input\*\* \| 4-digit, 6-digit \| 2 \| Verification \|

\| \*\*Stepper\*\* \| Horizontal, Vertical \| 2 \| Registration \|

\| \*\*Accordion\*\* \| Single, Multiple \| 4 \| FAQ, Details \|

\## TEMPLATES (Screen Layouts)

\| Component \| Variants \| Count \| Usage \|

\|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|

\| \*\*Auth Layout\*\* \| Login, Register \| 2 \| Authentication \|

\| \*\*Dashboard Layout\*\* \| With Nav, Without Nav \| 1 \| Main
screens \|

\| \*\*List Layout\*\* \| Scrollable, Paginated \| 6 \| History,
Products \|

\| \*\*Form Layout\*\* \| Single, Multi-step \| 4 \| Registration \|

\| \*\*Detail Layout\*\* \| Product, Transaction \| 3 \| Details \|

\| \*\*Profile Layout\*\* \| View, Edit \| 2 \| Profile \|

\| \*\*Empty State\*\* \| No Data, Error, Offline \| 8 \| All lists \|

\| \*\*Loading State\*\* \| Skeleton, Spinner \| 10 \| All screens \|

\| \*\*Success State\*\* \| Animation, Static \| 5 \| Actions \|

\| \*\*Error State\*\* \| Inline, Full Page \| 6 \| Forms, Pages \|

\## STATE VARIATIONS

\| Component State \| Count \| Components Affected \|

\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|

\| \*\*Default\*\* \| All \| All interactive components \|

\| \*\*Hover\*\* \| 45 \| Buttons, Cards, Links \|

\| \*\*Active/Pressed\*\* \| 45 \| Buttons, Tabs \|

\| \*\*Focus\*\* \| 28 \| Inputs, Buttons \|

\| \*\*Disabled\*\* \| 35 \| Buttons, Inputs, Toggles \|

\| \*\*Loading\*\* \| 22 \| Buttons, Forms, Lists \|

\| \*\*Error\*\* \| 18 \| Inputs, Forms \|

\| \*\*Success\*\* \| 15 \| Forms, Actions \|

\| \*\*Empty\*\* \| 12 \| Lists, Grids \|

\| \*\*Offline\*\* \| 8 \| Pages requiring network \|

\## SPECIAL COMPONENTS

\| Component \| Purpose \| Count \| Priority \|

\|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\|\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|

\| \*\*QR Scanner\*\* \| Scan codes \| 1 \| Critical \|

\| \*\*QR Generator\*\* \| Display codes \| 3 \| Critical \|

\| \*\*Floating Action Button\*\* \| Quick actions \| 2 \| High \|

\| \*\*Pull to Refresh\*\* \| Update content \| 5 \| High \|

\| \*\*Infinite Scroll\*\* \| Load more \| 4 \| Medium \|

\| \*\*Swipe Actions\*\* \| Quick actions on lists \| 3 \| Medium \|

\| \*\*Glassmorphism Card\*\* \| Balance display \| 2 \| High \|

\| \*\*Progress Ring\*\* \| Circular progress \| 1 \| Medium \|

\| \*\*Confetti Animation\*\* \| Success celebration \| 2 \| Low \|

\| \*\*Skeleton Loader\*\* \| Loading placeholder \| 8 \| High \|

\## TOTAL COMPONENT COUNT SUMMARY

\- \*\*Unique Components\*\*: 73

\- \*\*Total Instances\*\*: 850+

\- \*\*Reusable Rate\*\*: 87%

\- \*\*Custom Components\*\*: 12

\- \*\*Third-party\*\*: 5

4️⃣ IMPLEMENTATION PRIORITY LIST

markdown# 🎯 IMPLEMENTATION PRIORITY LIST

\## WEEK 1: FOUNDATION (Critical Path)

\### Day 1-2: Setup & Core Components

Priority: \*\*P0 - CRITICAL\*\*

\- \[ \] Project setup (Next.js, TypeScript, Tailwind)

\- \[ \] Design tokens configuration

\- \[ \] Button component (all variants)

\- \[ \] Input component (all types)

\- \[ \] Typography system

\- \[ \] Color system implementation

\- \[ \] Icon library setup

\### Day 3: Navigation & Layout

Priority: \*\*P0 - CRITICAL\*\*

\- \[ \] Bottom Navigation component

\- \[ \] Header component

\- \[ \] Layout templates

\- \[ \] Routing setup

\- \[ \] Tab bar component

\- \[ \] Screen transitions

\### Day 4: Forms & Authentication

Priority: \*\*P0 - CRITICAL\*\*

\- \[ \] Form field components

\- \[ \] Validation system

\- \[ \] Super Login screen

\- \[ \] OTP input component

\- \[ \] Error handling

\- \[ \] Success states

\### Day 5: Cards & Lists

Priority: \*\*P0 - CRITICAL\*\*

\- \[ \] Card components (all types)

\- \[ \] List item components

\- \[ \] Transaction row

\- \[ \] Product card

\- \[ \] Empty states

\- \[ \] Loading states

\## WEEK 2: CORE FEATURES

\### Day 6-7: Dashboard & Savings

Priority: \*\*P1 - HIGH\*\*

\- \[ \] Dashboard layout

\- \[ \] Balance card (glassmorphism)

\- \[ \] Quick action cards

\- \[ \] Promo carousel

\- \[ \] Activity feed

\- \[ \] Savings flow screens

\- \[ \] Top-up modal

\- \[ \] Withdraw request

\### Day 8-9: Marketplace

Priority: \*\*P1 - HIGH\*\*

\- \[ \] Product grid

\- \[ \] Search functionality

\- \[ \] Filter system

\- \[ \] Product detail sheet

\- \[ \] Shopping cart

\- \[ \] Checkout flow

\- \[ \] Payment integration

\### Day 10: QR & Transactions

Priority: \*\*P1 - HIGH\*\*

\- \[ \] QR scanner component

\- \[ \] QR generator

\- \[ \] Transaction list

\- \[ \] Transaction detail

\- \[ \] Filter/sort

\- \[ \] Export functionality

\## WEEK 3: ENHANCED FEATURES

\### Day 11-12: Fit Challenge

Priority: \*\*P2 - MEDIUM\*\*

\- \[ \] Progress ring component

\- \[ \] Daily check-in

\- \[ \] Photo upload

\- \[ \] Leaderboard

\- \[ \] Achievement system

\- \[ \] Points calculation

\### Day 13: Profile & Settings

Priority: \*\*P2 - MEDIUM\*\*

\- \[ \] Profile layout

\- \[ \] Edit profile

\- \[ \] Digital member card

\- \[ \] Settings menu

\- \[ \] Notification settings

\- \[ \] Help center

\### Day 14: Modals & Sheets

Priority: \*\*P2 - MEDIUM\*\*

\- \[ \] Bottom sheet component

\- \[ \] Modal system

\- \[ \] Alert dialogs

\- \[ \] Toast notifications

\- \[ \] Snackbar messages

\### Day 15: Polish & Optimization

Priority: \*\*P2 - MEDIUM\*\*

\- \[ \] Animation system

\- \[ \] Micro-interactions

\- \[ \] Performance optimization

\- \[ \] Accessibility audit

\- \[ \] Cross-browser testing

\## WEEK 4: REFINEMENT

\### Day 16-17: Advanced Components

Priority: \*\*P3 - NICE TO HAVE\*\*

\- \[ \] Calendar component

\- \[ \] Image picker

\- \[ \] Accordion

\- \[ \] Stepper

\- \[ \] Advanced filters

\### Day 18-19: Error Handling & Edge Cases

Priority: \*\*P3 - NICE TO HAVE\*\*

\- \[ \] Offline mode

\- \[ \] Error boundaries

\- \[ \] Retry mechanisms

\- \[ \] Cache strategies

\- \[ \] Network detection

\### Day 20: Testing & Documentation

Priority: \*\*P3 - NICE TO HAVE\*\*

\- \[ \] Component testing

\- \[ \] Integration testing

\- \[ \] Storybook setup

\- \[ \] Documentation

\- \[ \] Deployment prep

\## PRIORITY MATRIX

\| Priority \| Components \| Business Impact \| Technical Risk \|

\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|

\| \*\*P0\*\* \| Auth, Navigation, Forms \| Blocks everything \| High \|

\| \*\*P1\*\* \| Dashboard, Savings, Market \| Core features \| Medium
\|

\| \*\*P2\*\* \| Fit, Profile, Modals \| Enhanced UX \| Low \|

\| \*\*P3\*\* \| Advanced, Polish \| Nice to have \| Very Low \|

\## DECISION CRITERIA

\### Build vs Buy Decision:

\*\*BUILD\*\*:

\- Core business logic components

\- Custom UI/UX requirements

\- Performance-critical components

\*\*BUY/USE LIBRARY\*\*:

\- QR Scanner (react-qr-reader)

\- Calendar (react-calendar)

\- Carousel (swiper)

\- Charts (recharts)

\- Icons (lucide-react)

\## RISK MITIGATION

\| Risk \| Mitigation Strategy \|

\|\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|

\| Component complexity \| Start with simple version, iterate \|

\| Performance issues \| Lazy loading, virtualization \|

\| Browser compatibility \| Progressive enhancement \|

\| State management \| Start with React state, add Zustand if needed \|

\| Design inconsistency \| Strict design token usage \|

5️⃣ FOLDER STRUCTURE

markdown# 📁 COMPONENT FOLDER STRUCTURE

src/

├── components/

│ ├── atoms/ \# Basic building blocks

│ │ ├── Button/

│ │ │ ├── Button.tsx

│ │ │ ├── Button.styles.ts

│ │ │ ├── Button.types.ts

│ │ │ ├── Button.test.tsx

│ │ │ ├── Button.stories.tsx

│ │ │ └── index.ts

│ │ ├── Input/

│ │ │ ├── Input.tsx

│ │ │ ├── Input.styles.ts

│ │ │ ├── Input.types.ts

│ │ │ └── index.ts

│ │ ├── Icon/

│ │ │ ├── Icon.tsx

│ │ │ ├── icons/

│ │ │ └── index.ts

│ │ ├── Badge/

│ │ ├── Checkbox/

│ │ ├── Radio/

│ │ ├── Toggle/

│ │ ├── Chip/

│ │ ├── Avatar/

│ │ └── index.ts

│ │

│ ├── molecules/ \# Composed components

│ │ ├── Card/

│ │ │ ├── Card.tsx

│ │ │ ├── Card.styles.ts

│ │ │ ├── Card.types.ts

│ │ │ └── index.ts

│ │ ├── FormField/

│ │ │ ├── FormField.tsx

│ │ │ ├── FormField.types.ts

│ │ │ └── index.ts

│ │ ├── SearchBar/

│ │ ├── TabBar/

│ │ ├── ListItem/

│ │ ├── ProductCard/

│ │ ├── TransactionRow/

│ │ ├── NotificationItem/

│ │ ├── ProgressBar/

│ │ └── index.ts

│ │

│ ├── organisms/ \# Complex components

│ │ ├── Header/

│ │ │ ├── Header.tsx

│ │ │ ├── Header.styles.ts

│ │ │ └── index.ts

│ │ ├── BottomNavigation/

│ │ │ ├── BottomNavigation.tsx

│ │ │ ├── BottomNavigation.styles.ts

│ │ │ └── index.ts

│ │ ├── BottomSheet/

│ │ ├── Modal/

│ │ ├── Carousel/

│ │ ├── Calendar/

│ │ ├── ImagePicker/

│ │ ├── OTPInput/

│ │ ├── Stepper/

│ │ └── index.ts

│ │

│ ├── templates/ \# Page layouts

│ │ ├── AuthLayout/

│ │ │ ├── AuthLayout.tsx

│ │ │ └── index.ts

│ │ ├── DashboardLayout/

│ │ ├── ListLayout/

│ │ ├── FormLayout/

│ │ ├── DetailLayout/

│ │ └── index.ts

│ │

│ ├── features/ \# Feature-specific components

│ │ ├── auth/

│ │ │ ├── SuperLogin/

│ │ │ ├── OTPVerification/

│ │ │ └── ForgotPassword/

│ │ ├── dashboard/

│ │ │ ├── BalanceCard/

│ │ │ ├── QuickActions/

│ │ │ └── ActivityFeed/

│ │ ├── savings/

│ │ │ ├── SavingsOverview/

│ │ │ ├── TopUpModal/

│ │ │ └── WithdrawRequest/

│ │ ├── marketplace/

│ │ │ ├── ProductGrid/

│ │ │ ├── ShoppingCart/

│ │ │ └── Checkout/

│ │ ├── fit-challenge/

│ │ │ ├── ProgressRing/

│ │ │ ├── DailyCheckin/

│ │ │ └── Leaderboard/

│ │ ├── qr/

│ │ │ ├── QRScanner/

│ │ │ └── QRDisplay/

│ │ └── profile/

│ │ ├── ProfileInfo/

│ │ ├── DigitalCard/

│ │ └── SettingsMenu/

│ │

│ └── shared/ \# Shared/utility components

│ ├── LoadingStates/

│ │ ├── Skeleton/

│ │ ├── Spinner/

│ │ └── index.ts

│ ├── ErrorStates/

│ │ ├── ErrorBoundary/

│ │ ├── ErrorMessage/

│ │ └── index.ts

│ ├── EmptyStates/

│ ├── SuccessStates/

│ └── index.ts

│

├── styles/

│ ├── globals.css \# Global styles

│ ├── variables.css \# CSS variables

│ └── utils.css \# Utility classes

│

├── design-tokens/ \# Design system tokens

│ ├── colors.ts

│ ├── spacing.ts

│ ├── typography.ts

│ ├── effects.ts

│ └── index.ts

│

├── hooks/ \# Custom React hooks

│ ├── useAuth.ts

│ ├── useApi.ts

│ ├── useForm.ts

│ ├── useModal.ts

│ └── index.ts

│

├── utils/ \# Utility functions

│ ├── formatters.ts

│ ├── validators.ts

│ ├── helpers.ts

│ └── index.ts

│

├── types/ \# TypeScript types

│ ├── components.d.ts

│ ├── api.d.ts

│ ├── models.d.ts

│ └── index.d.ts

│

├── constants/ \# App constants

│ ├── routes.ts

│ ├── api.ts

│ ├── config.ts

│ └── index.ts

│

├── services/ \# API services

│ ├── auth.service.ts

│ ├── savings.service.ts

│ ├── marketplace.service.ts

│ └── index.ts

│

├── store/ \# State management (Zustand)

│ ├── auth.store.ts

│ ├── cart.store.ts

│ ├── ui.store.ts

│ └── index.ts

│

├── pages/ \# Next.js pages (if using Pages Router)

│ └── \...

│

└── app/ \# Next.js app (if using App Router)

└── \...

\## COMPONENT FILE STRUCTURE PATTERN

\`\`\`typescript

// Example: Button component structure

// Button.types.ts

export interface ButtonProps {

variant?: \'primary\' \| \'secondary\' \| \'ghost\' \| \'danger\';

size?: \'sm\' \| \'md\' \| \'lg\';

isLoading?: boolean;

isDisabled?: boolean;

leftIcon?: React.ReactNode;

rightIcon?: React.ReactNode;

children: React.ReactNode;

onClick?: () =\> void;

className?: string;

}

// Button.styles.ts

export const buttonStyles = {

base: \'inline-flex items-center justify-center font-semibold
transition-all\',

variants: {

primary: \'bg-emerald-600 text-white hover:bg-emerald-700\',

secondary: \'border-2 border-emerald-600 text-emerald-600\',

ghost: \'text-emerald-600 hover:bg-emerald-50\',

danger: \'bg-red-500 text-white hover:bg-red-600\',

},

sizes: {

sm: \'h-9 px-3 text-sm\',

md: \'h-12 px-6 text-base\',

lg: \'h-14 px-8 text-lg\',

},

disabled: \'opacity-50 cursor-not-allowed\',

loading: \'cursor-wait\',

};

// Button.tsx

import React from \'react\';

import { cn } from \'@/utils/cn\';

import { Spinner } from \'@/components/atoms/Spinner\';

import { ButtonProps } from \'./Button.types\';

import { buttonStyles } from \'./Button.styles\';

export const Button: React.FC\<ButtonProps\> = ({

variant = \'primary\',

size = \'md\',

isLoading = false,

isDisabled = false,

leftIcon,

rightIcon,

children,

onClick,

className,

\...props

}) =\> {

return (

\<button

className={cn(

buttonStyles.base,

buttonStyles.variants\[variant\],

buttonStyles.sizes\[size\],

isDisabled && buttonStyles.disabled,

isLoading && buttonStyles.loading,

className

)}

disabled={isDisabled \|\| isLoading}

onClick={onClick}

{\...props}

\>

{isLoading && \<Spinner className=\"mr-2\" /\>}

{!isLoading && leftIcon && \<span
className=\"mr-2\"\>{leftIcon}\</span\>}

{children}

{rightIcon && \<span className=\"ml-2\"\>{rightIcon}\</span\>}

\</button\>

);

};

// index.ts

export { Button } from \'./Button\';

export type { ButtonProps } from \'./Button.types\';

IMPORT/EXPORT PATTERN

typescript// components/atoms/index.ts

export \* from \'./Button\';

export \* from \'./Input\';

export \* from \'./Icon\';

export \* from \'./Badge\';

// \... etc

// Usage in other files

import { Button, Input, Badge } from \'@/components/atoms\';

\-\--

\## 📋 SUMMARY

This comprehensive design system documentation provides:

1\. \*\*Complete Design Tokens\*\* - All colors, spacing, typography,
and effects defined as reusable tokens

2\. \*\*User Flow Diagram\*\* - Complete Mermaid diagram showing all
screen connections and user paths

3\. \*\*Component Inventory\*\* - 73 unique components with 850+
instances catalogued

4\. \*\*Implementation Priority\*\* - 4-week sprint plan with clear
priorities (P0-P3)

5\. \*\*Folder Structure\*\* - Scalable component organization following
Atomic Design principles

\### 🚀 Next Steps:

1\. Export these tokens to \`tailwind.config.js\`

2\. Set up the folder structure

3\. Start building P0 components (Week 1)

4\. Follow the user flow for screen implementation

5\. Use the component inventory to avoid duplicates

This documentation serves as your single source of truth for the entire
Sinoman SuperApp development! 🎯
