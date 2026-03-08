import { Outlet } from "react-router";

export default function RootLayout() {
  return (
    <div className="font-sans antialiased">
      <Outlet />
    </div>
  );
}
