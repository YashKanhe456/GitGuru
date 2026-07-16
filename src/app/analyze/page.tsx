import type { Metadata } from "next";
import { AnalysisWorkspace } from "./workspace";

export const metadata: Metadata = {
  title: "Analyze a repository | Vulcan",
  description: "Repository intelligence and deterministic engineering decisions.",
};

export default function AnalyzePage() {
  return <AnalysisWorkspace />;
}
