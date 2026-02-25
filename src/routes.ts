import { createBrowserRouter } from "react-router";
import { HomePage } from "./app/pages/HomePage";
import { ScannerPage } from "./app/pages/ScannerPage";
import { ReportsPage } from "./app/pages/ReportsPage";
import { RemindersPage } from "./app/pages/RemindersPage";
import { EmergencyPage } from "./app/pages/EmergencyPage";
import { QRCodePage } from "./app/pages/QRCodePage";
import { ProfilePage } from "./app/pages/ProfilePage";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/scanner",
    Component: ScannerPage,
  },
  {
    path: "/reports",
    Component: ReportsPage,
  },
  {
    path: "/reminders",
    Component: RemindersPage,
  },
  {
    path: "/emergency",
    Component: EmergencyPage,
  },
  {
    path: "/qr-code",
    Component: QRCodePage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
]);