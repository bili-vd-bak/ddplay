import Router from "preact-router";
import { Link } from "preact-router/match";
import DDplay from "./ddplay.tsx";
import Settings from "./settings.tsx";
import "./app.css";

export function App() {
  return (
    <>
      <nav className="flex flex-col items-center justify-between">
        <ul className="menu menu-horizontal bg-base-200 rounded-box">
          <li>
            <Link href="/">播放器</Link>
          </li>
          <li>
            <Link href="/settings">设置</Link>
          </li>
        </ul>
      </nav>
      <Router>
        <DDplay default />
        <Settings path="/settings" />
      </Router>
    </>
  );
}
