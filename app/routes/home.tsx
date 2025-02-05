import type { Route } from "./+types/home";
import { Fragment, useEffect, useRef } from "react";
import { Link } from "react-router";
import intrica from "../images/intrica.webp";
import { useIsMobile } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Story Palace" },
    { name: "description", content: "A magical place!" },
  ];
}

export default function Home() {
  const beamRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        if (!beamRef.current || !containerRef.current) return;

        // Get container position
        const rect = containerRef.current.getBoundingClientRect();

        // Calculate relative mouse position
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS custom properties for mask position
        beamRef.current.style.setProperty("--mouse-x", `${x}px`);
        beamRef.current.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isMobile = useIsMobile();

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white font-body">
        {/* Ambient Background Image Container */}
        <div ref={containerRef} className="absolute inset-0 z-0">
          <img
            src={intrica}
            alt="Ambient background"
            className="w-full h-full object-cover"
          />

          {/* Mouse-following Beam */}
          {!isMobile && (
            <div
              ref={beamRef}
              className="absolute inset-0 pointer-events-none"
              style={{
                //rgba(0, 0, 0, 0.85): Overlay darkness (0 = transparent, 1 = fully black)
                background: "rgba(0, 0, 0, 0.80)",
                //circle 200px in the radial gradient: Spotlight size
                maskImage: `radial-gradient(
                  circle 200px at var(--mouse-x) var(--mouse-y), 
                  transparent 0%,
                  black 100%
                )`,
                WebkitMaskImage: `radial-gradient(
                  circle 200px at var(--mouse-x) var(--mouse-y),
                  transparent 0%,
                  black 100%
                )`,
                //transition timing: Movement smoothness
                transition: "mask-position 0.3s, -webkit-mask-position 0.3s",
              }}
            />
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10">
          {/* Navigation Bar */}
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold font-heading">
                StoryPalace
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  to="/voxbox-showcase"
                  className="hover:text-purple-400 transition font-medium"
                >
                  VoxBox
                </Link>
                <Link
                  to="/stories-showcase"
                  className="hover:text-purple-400 transition font-medium"
                >
                  Stories
                </Link>
                <Link
                  to="/about"
                  className="hover:text-purple-400 transition font-medium"
                >
                  About
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/sign-in"
                className="px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Get Started
              </Link>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight font-heading">
                Bring Your Stories to Life
              </h1>
              <p className="text-xl text-gray-300 mb-12 font-medium">
                Immerse yourself in magical narratives and create lasting
                auditory memories with our AI-powered story platform.
              </p>

              <div className="flex justify-center space-x-4 mb-20">
                <Link
                  to="/try-free"
                  className="px-8 py-4 bg-purple-600 rounded-lg text-lg font-semibold hover:bg-purple-700 transition font-heading"
                >
                  Try for Free
                </Link>
                <Link
                  to="/learn-more"
                  className="px-8 py-4 border border-gray-600 rounded-lg text-lg hover:border-purple-400 hover:text-purple-400 transition font-heading"
                >
                  Learn More
                </Link>
              </div>

              {/* Demo Section */}
              <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold mb-6 font-heading">
                  Sample Story Demo
                </h2>
                <div className="max-w-2xl mx-auto">
                  {/* <AudioPlayer src="/sample-story.mp3" className="rounded-lg" /> */}
                </div>
                <p className="mt-4 text-gray-400 font-medium">
                  Experience our premium audio quality with this sample story
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="container mx-auto px-6 py-20">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  title: "AI Narration",
                  desc: "Natural-sounding voices powered by cutting-edge AI",
                },
                {
                  title: "Custom Stories",
                  desc: "Create and personalize your own stories",
                },
                {
                  title: "Multi-Platform",
                  desc: "Listen anywhere, anytime on any device",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-gray-800 rounded-xl hover:bg-gray-750 transition"
                >
                  <h3 className="text-xl font-semibold mb-3 font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
