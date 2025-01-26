import type { Route } from "./+types/home";
import { Fragment } from "react";
import { Outlet } from "react-router";
import AudioPlayer from "~/components/audio-player";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <Fragment>
      <main className="max-w-screen-lg mx-auto my-4">
        <Outlet />
      </main>
      <AudioPlayer />
    </Fragment>
  );
}
