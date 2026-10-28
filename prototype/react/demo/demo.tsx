import * as React from "react";
import { createRoot } from "react-dom/client";
import { Box, Check, Download, FileDiff, LogOut, Mic, Settings, Trash2, LifeBuoy } from "lucide-react";
import { Button, Combobox, Composer, Dialog, Drawer, Field, Input, Menu, Modal, Textarea } from "../src";

const SYSTEMS = ["Rentify", "Ledgerline", "SensePortal", "HRIS Nusantara", "Kurir Hub", "Portal Vendor", "Kanteen", "Personal Blog"];
const SKILLS = [
  { kind: "skill" as const, name: "write-prd", desc: "Draft or revise a PRD from notes and the System's source." },
  { kind: "skill" as const, name: "estimate", desc: "Re-estimate tickets with the current breakdown." },
  { kind: "tool" as const, name: "document", desc: "Read an attached document and cite it." },
  { kind: "tool" as const, name: "repo-search", desc: "Search the connected repository." },
];

function App() {
  const [sys, setSys] = React.useState<string | null>(null);
  const [conn, setConn] = React.useState<string | null>("hris-azure");
  const [drawer, setDrawer] = React.useState(false);
  const [drawer2, setDrawer2] = React.useState(false);
  const [modal, setModal] = React.useState(false);
  const [dialog, setDialog] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  const [url, setUrl] = React.useState("github.com/owner");
  const say = (s: string) => setLog(l => [...l, s]);
  return (
    <div className="mx-auto grid max-w-[880px] gap-8 p-8">
      <section className="grid gap-3">
        <h2 className="text-md font-semibold">Button</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">New initiative</Button>
          <Button>Review breakdown</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger"><Trash2 strokeWidth={1.75} />Delete System</Button>
          <Button variant="primary" cost="2.15 SP"><Check strokeWidth={1.75} />Approve</Button>
          <Button variant="primary" loading>Approving</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" variant="primary">Large</Button>
          <Button iconOnly aria-label="Download"><Download strokeWidth={1.75} /></Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-4">
        <h2 className="col-span-2 text-md font-semibold">Field & input</h2>
        <Field label="Display name" hint="How your name appears to your team."><Input defaultValue="Ardian Yusuf" /></Field>
        <Field label="Repository URL" error={/^https:\/\//.test(url) ? undefined : "Enter a full URL, like https://github.com/owner/skills"}>
          <Input value={url} onChange={e => setUrl(e.target.value)} />
        </Field>
        <Field label="Name" note="required"><Input placeholder="my-tool" /></Field>
        <Field label="Workspace name" hint="Only the Workspace Owner can rename it."><Input value="Refactory" disabled readOnly /></Field>
        <Field label="What is this initiative about?" className="col-span-2"><Textarea autosize defaultValue="Refresh the Support API README from current source; change nothing else." /></Field>
      </section>
      <section className="grid grid-cols-2 gap-4">
        <h2 className="col-span-2 text-md font-semibold">Combobox</h2>
        <Field label="Software System"><Combobox options={SYSTEMS.map(s => ({ value: s, label: s }))} value={sys} onChange={setSys} placeholder="Choose a System" /></Field>
        <Field label="Repository for TKT-1">
          <Combobox value={conn} onChange={setConn} options={[
            { value: "hris-azure", label: "HRIS Azure", hint: "Azure DevOps", group: "Connected to HRIS Nusantara" },
            { value: "gitea-sari", label: "Gitea Sari", hint: "gitea.example.id", group: "Other connections" },
            { value: "gitea-bagus", label: "Gitea Bagus", hint: "gitea.example.id", group: "Other connections" },
          ]} />
        </Field>
        <div><Combobox icon={<Box strokeWidth={1.75} />} width="auto" options={[{ value: "", label: "All systems" }, ...SYSTEMS.map(s => ({ value: s, label: s }))]} value={sys ?? ""} onChange={v => setSys(v || null)} aria-label="Filter by System" /></div>
      </section>
      <section className="grid gap-3">
        <h2 className="text-md font-semibold">Menu & overlays</h2>
        <div className="flex flex-wrap gap-2">
          <Menu label="Account" trigger={<Button id="acct">Account</Button>} items={[
            { head: <div><b className="block text-sm font-semibold">Ardian Yusuf</b><small className="text-xs text-app-text-tertiary">ardian@refactory.id</small></div> },
            { label: "Settings", icon: <Settings strokeWidth={1.75} />, onSelect: () => say("menu:settings") },
            { label: "Support", icon: <LifeBuoy strokeWidth={1.75} />, onSelect: () => say("menu:support") },
            "divider",
            { label: "Sign out", icon: <LogOut strokeWidth={1.75} />, danger: true, onSelect: () => say("menu:signout") },
          ]} />
          <Button id="openDrawer" onClick={() => setDrawer(true)}>Open breakdown</Button>
          <Button id="openModal" variant="primary" onClick={() => setModal(true)}>New initiative</Button>
          <Button id="openDialog" variant="primary" cost="2.15 SP" onClick={() => setDialog(true)}>Approve</Button>
        </div>
        <p id="log" className="text-xs text-app-text-tertiary">{log.join(" ")}</p>
      </section>
      <section className="grid gap-3">
        <h2 className="text-md font-semibold">Composer</h2>
        <Composer placeholder="Draft your thinking… notes feed the plan. Type / for a skill" cta="Post note" items={SKILLS} onSend={m => say("sent:" + m.text + "|" + m.picks.map(p => p.name).join(","))} />
        <Composer compact placeholder="Describe the outcome you need. Type / for a skill" items={SKILLS} onSend={m => say("sent2:" + m.text)}
          tools={<Button variant="ghost" size="sm" iconOnly aria-label="Record voice message"><Mic strokeWidth={1.75} /></Button>} />
      </section>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Breakdown" sub="1 ticket · 2.15 SP" footer={<><Button onClick={() => setDrawer(false)}>Close</Button><Button variant="primary">Accept</Button></>}>
        <p>TKT-1 · Validate and refresh the support-api README.</p>
        <Field label="Who merges"><Combobox value="me" onChange={() => {}} options={[{ value: "me", label: "I merge" }, { value: "agent", label: "The agent merges after review" }]} /></Field>
        <div><Button id="openChanges" onClick={() => setDrawer2(true)}><FileDiff strokeWidth={1.75} />View changes</Button></div>
      </Drawer>
      <Drawer open={drawer2} wide onClose={() => setDrawer2(false)} title="Changes · README.md"><pre className="font-mono text-xs">- old line{"\n"}+ new line</pre></Drawer>
      <Modal open={modal} onClose={() => setModal(false)} title="New initiative" footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => { setModal(false); say("started"); }}>Start</Button></>}>
        <Field label="What is this initiative about?"><Textarea autosize autoFocus placeholder="Describe the outcome" /></Field>
        <Field label="Software System"><Combobox options={SYSTEMS.map(s => ({ value: s, label: s }))} value={sys} onChange={setSys} placeholder="Choose a System" /></Field>
      </Modal>
      <Dialog open={dialog} title="Approve TKT-1's delivery?" confirmLabel="Approve" cost="2.15 SP" onCancel={() => setDialog(false)} onConfirm={() => { setDialog(false); say("approved"); }}>
        Konteks will run the delivery on rf-01, up to 2.15 SP. Model cost on your subscription: $0.57 – $2.02.
      </Dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
