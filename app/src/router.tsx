import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router";
import DashboardLayout from "@/layouts/DashboardLayout";
import HubLayout from "@/layouts/HubLayout";

// Lazy-loaded pages
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const SignupPage = React.lazy(() => import("@/pages/SignupPage"));
const DocsPage = React.lazy(() => import("@/pages/DocsPage"));

const HubPage = React.lazy(() => import("@/pages/HubPage"));
const HubOverviewPage = React.lazy(() => import("@/pages/HubOverviewPage"));
const HubPitchPage = React.lazy(() => import("@/pages/HubPitchPage"));
const HubFaqPage = React.lazy(() => import("@/pages/HubFaqPage"));

const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const UsagePage = React.lazy(() => import("@/pages/UsagePage"));
const RoutingPage = React.lazy(() => import("@/pages/RoutingPage"));
const AgentsPage = React.lazy(() => import("@/pages/AgentsPage"));
const ModelsPage = React.lazy(() => import("@/pages/ModelsPage"));
const CatalogPage = React.lazy(() => import("@/pages/CatalogPage"));
const AfricanPage = React.lazy(() => import("@/pages/AfricanPage"));
const RecommendationsPage = React.lazy(() => import("@/pages/RecommendationsPage"));
const KeysPage = React.lazy(() => import("@/pages/KeysPage"));
const BillingPage = React.lazy(() => import("@/pages/BillingPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));
const QuickstartPage = React.lazy(() => import("@/pages/QuickstartPage"));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <SuspenseWrapper>
        <LandingPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/login",
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/signup",
    element: (
      <SuspenseWrapper>
        <SignupPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/docs",
    element: (
      <SuspenseWrapper>
        <DocsPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/hub",
    element: <HubLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <HubPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "overview",
        element: (
          <SuspenseWrapper>
            <HubOverviewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pitch",
        element: (
          <SuspenseWrapper>
            <HubPitchPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "faq",
        element: (
          <SuspenseWrapper>
            <HubFaqPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/usage",
        element: (
          <SuspenseWrapper>
            <UsagePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/routing",
        element: (
          <SuspenseWrapper>
            <RoutingPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/agents",
        element: (
          <SuspenseWrapper>
            <AgentsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/models",
        element: (
          <SuspenseWrapper>
            <ModelsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/catalog",
        element: (
          <SuspenseWrapper>
            <CatalogPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/african",
        element: (
          <SuspenseWrapper>
            <AfricanPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/recommendations",
        element: (
          <SuspenseWrapper>
            <RecommendationsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/keys",
        element: (
          <SuspenseWrapper>
            <KeysPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/billing",
        element: (
          <SuspenseWrapper>
            <BillingPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/settings",
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/quickstart",
        element: (
          <SuspenseWrapper>
            <QuickstartPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
