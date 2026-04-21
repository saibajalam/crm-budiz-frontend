import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import NFTMarketplace from "views/admin/marketplace";
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";
import RTLDefault from "views/rtl/default";
import KanbanBoard from "pages/deals/KanbanBoard";
import DealDetailPage from "pages/deals/DealDetailPage";
import EntityGraphView from "pages/graph/EntityGraphView";
import AnalyticsDashboard from "pages/analytics/AnalyticsDashboard";
import ContactDetailPage from "pages/contacts/ContactDetailPage";

// Auth Imports
import SignIn from "views/auth/SignIn";
import Login from "modules/auth/Login";

// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
  MdLock,
  MdViewKanban,
  MdInsights,
  MdShare,
} from "react-icons/md";

const routes = [
  {
    name: "Main Dashboard",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  {
    name: "NFT Marketplace",
    layout: "/admin",
    path: "nft-marketplace",
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
    component: <NFTMarketplace />,
    secondary: true,
  },
  {
    name: "Data Tables",
    layout: "/admin",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "data-tables",
    component: <DataTables />,
  },
  {
    name: "Deals Pipeline",
    layout: "/admin",
    icon: <MdViewKanban className="h-6 w-6" />,
    path: "deals-pipeline",
    component: <KanbanBoard />,
  },
  {
    name: "Relationship Graph",
    layout: "/admin",
    icon: <MdShare className="h-6 w-6" />,
    path: "graph",
    component: <EntityGraphView />,
  },
  {
    name: "Analytics",
    layout: "/admin",
    icon: <MdInsights className="h-6 w-6" />,
    path: "analytics",
    component: <AnalyticsDashboard />,
  },
  {
    name: "Deal Detail",
    layout: "/admin",
    path: "deals/:id",
    component: <DealDetailPage />,
    hidden: true,
  },
  {
    name: "Contact Detail",
    layout: "/admin",
    path: "contacts/:id",
    component: <ContactDetailPage />,
    hidden: true,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  {
    name: "RTL Admin",
    layout: "/rtl",
    path: "rtl",
    icon: <MdHome className="h-6 w-6" />,
    component: <RTLDefault />,
  },
  {
    name: "Login",
    layout: "/auth",
    path: "login",
    component: <Login />,
  },
];
export default routes;
