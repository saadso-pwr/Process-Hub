import {
  canonicalToBuilder,
  layoutDiagram,
  parseProcessText,
  type DiagramDoc,
} from "@/components/builder/diagram";

/** Build a laid-out diagram doc from plain process text (server-side). */
function buildDoc(text: string): DiagramDoc {
  const built = canonicalToBuilder(parseProcessText(text));
  return { nodes: layoutDiagram(built.nodes, built.edges), edges: built.edges };
}

export const SEED_FOLDERS = ["Neos Intelligence", "Internal Processes", "Unsorted"];

export const SEED_DIAGRAMS: { name: string; folder: string; kind: string; doc: DiagramDoc }[] = [
  {
    name: "Hire to Retire Process Map",
    folder: "Unsorted",
    kind: "flow",
    doc: buildDoc(
      `Start: New hire needed
Create JD
Create job post
Post live
Decision: Goldenday needed?
- Yes: Run Goldenday process
- No: Skip Goldenday
End: Posting complete`,
    ),
  },
  {
    name: "AI Lab Pilot Conceptual Model",
    folder: "Unsorted",
    kind: "flow",
    doc: buildDoc(
      `Start: Idea
Define hypothesis
Run pilot
Decision: Promising?
- Yes: Scale up
- No: Archive learnings
End: Decision logged`,
    ),
  },
  {
    name: "Physical AI Conceptual Model",
    folder: "Unsorted",
    kind: "flow",
    doc: buildDoc(`Start: Sensor input
Perceive
Plan
Act
End: Outcome`),
  },
];
