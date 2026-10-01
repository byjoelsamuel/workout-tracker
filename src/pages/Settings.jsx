// Everything you set once and then leave alone, in one place.
//
// These used to be scattered: the unit toggle only existed inside the set
// builder (so you had to pick a loaded movement to find it), the tutorial was a
// "?" in the nav, Naru was switched back on from the bottom of the About page,
// and there was no way to edit a profile after creating it at all.
import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../components/Dialog.jsx";
import { BodyFields } from "../components/ProfileFields.jsx";
import { useToast } from "../components/Toaster.jsx";
import { NumberStepper } from "../components/NumberStepper.jsx";
import { Button, Card, Field, PageHeader, Segmented, Switch } from "../components/primitives.jsx";
import { useCoachEnabled, useExerciseLog, useRestSeconds, useUnit, useUser } from "../hooks/useStore.js";
import { useTheme } from "../hooks/useTheme.js";
import { deleteUser, exportBackup, importBackup } from "../lib/store.js";
import { formatClock } from "../lib/time.js";
import { fromProfileDraft, toProfileDraft, validateProfile } from "../lib/profile.js";
import { UNITS } from "../lib/units.js";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { isDesktop } from "../lib/platform.js";

// Where the data lives, in words — the browser on the web, the app on desktop.
const HERE = isDesktop ? "this app" : "this browser";

const THEMES = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function Row({ title, detail, children }) {
  return (
    <div className="settings-row">
      <div className="settings-text">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      <div className="settings-control">{children}</div>
    </div>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <motion.div variants={listItemVariants}>
      <Card className={className}>
        <h2>{title}</h2>
        {children}
      </Card>
    </motion.div>
  );
}

// Only the fields that actually changed. Saving every field would rewrite the
// ones you didn't touch — and a height entered in feet doesn't survive the
// round trip exactly (180 cm comes back as 180.3), so an untouched height would
// drift every time you renamed yourself.
function changedPatch(initial, draft, unit) {
  const after = fromProfileDraft(draft, unit);
  const patch = {};
  if (draft.name !== initial.name) patch.name = after.name;
  if (draft.bodyweight !== initial.bodyweight) patch.bodyweight = after.bodyweight;
  if (draft.heightCm !== initial.heightCm || draft.heightFt !== initial.heightFt || draft.heightIn !== initial.heightIn) {
    patch.height = after.height;
  }
  if (draft.age !== initial.age) patch.age = after.age;
  return Object.keys(patch).length ? patch : null;
}

function ProfileSection({ user, unit, onSave }) {
  const initial = useMemo(() => toProfileDraft(user, unit), [user, unit]);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [lastInitial, setLastInitial] = useState(initial);

  // A saved profile or a unit switch rebuilds the draft from storage, in the
  // unit now on screen.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setDraft(initial);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const onField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  function save(event) {
    event.preventDefault();
    const found = validateProfile(draft, unit);
    setErrors(found);
    if (Object.keys(found).length) return;
    const patch = changedPatch(initial, draft, unit);
    if (patch) onSave(patch);
  }

  return (
    <Section title="Profile">
      <form className="form" onSubmit={save} noValidate>
        <Field label="Name" error={errors.name}>
          {(props) => (
            <input {...props} value={draft.name} maxLength={30} onChange={(e) => onField("name", e.target.value)} />
          )}
        </Field>
        <BodyFields draft={draft} onField={onField} unit={unit} errors={errors} />
        <div className="settings-actions">
          <Link to="/welcome" className="row-action">
            Switch profile
          </Link>
          <span className="settings-actions-right">
            {dirty && (
              <Button size="small" variant="secondary" onClick={() => setDraft(initial)}>
                Discard
              </Button>
            )}
            <Button size="small" type="submit" disabled={!dirty}>
              Save changes
            </Button>
          </span>
        </div>
      </form>
    </Section>
  );
}

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings() {
  const userId = useSearchParams()[0].get("user");
  const navigate = useNavigate();
  const toast = useToast();
  const [user, saveUser] = useUser(userId);
  const { logs, refresh } = useExerciseLog(userId);
  const [unit, setUnit] = useUnit();
  const [restSeconds, setRestSeconds] = useRestSeconds();
  const [coachEnabled, setCoachEnabled] = useCoachEnabled();
  const { preference, setPreference } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  if (!user) return <Navigate to="/welcome" replace />;

  function exportData() {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`tsyoku-naru-backup-${stamp}.json`, JSON.stringify(exportBackup(), null, 2));
    toast.show({ title: "Backup downloaded", body: `It holds every profile in ${HERE}.` });
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const result = importBackup(JSON.parse(await file.text()));
      refresh();
      const parts = [];
      if (result.users) parts.push(`${result.users} ${result.users === 1 ? "profile" : "profiles"}`);
      if (result.logs) parts.push(`${result.logs} ${result.logs === 1 ? "entry" : "entries"}`);
      toast.show({
        title: parts.length ? `Imported ${parts.join(" and ")}` : "Nothing new to import",
        body: result.skipped
          ? `${result.skipped} ${result.skipped === 1 ? "row was" : "rows were"} already here or unreadable, and left alone.`
          : undefined,
      });
    } catch (error) {
      toast.show({
        title: "Couldn't import that file",
        body: error instanceof SyntaxError ? "It isn't valid JSON." : error.message,
      });
    }
  }

  function removeProfile() {
    deleteUser(user.id);
    setDeleting(false);
    toast.show({ title: `Deleted ${user.name}`, body: `Their profile and history are gone from ${HERE}.` });
    navigate("/welcome", { replace: true });
  }

  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader eyebrow={user.name} title="Settings" />

      <motion.div className="card-stack wide" variants={listVariants} initial="hidden" animate="show">
        <ProfileSection
          user={user}
          unit={unit}
          onSave={(patch) => {
            saveUser(patch);
            toast.show({ title: "Profile saved" });
          }}
        />

        <Section title="Training">
          <Row title="Units" detail="How weights are shown. History is stored in kilograms and never changes.">
            <Segmented size="small" label="Weight unit" options={UNITS} value={unit} onChange={setUnit} />
          </Row>
          <Row title="Rest timer" detail={`Starts after every set you log · ${formatClock(restSeconds * 1000)}`}>
            <span className="settings-stepper">
              <NumberStepper
                value={String(restSeconds)}
                onChange={(v) => v !== "" && setRestSeconds(Number(v))}
                step={15}
                min={15}
                max={600}
                label="Rest timer, seconds"
              />
            </span>
          </Row>
          <Row title="Naru" detail="The workout planner on the dashboard.">
            <Switch checked={coachEnabled} onChange={setCoachEnabled} label="Show Naru" />
          </Row>
          <Row title="Theme" detail="System follows your device's light or dark setting.">
            <Segmented size="small" label="Theme" options={THEMES} value={preference} onChange={(next) => setPreference(next)} />
          </Row>
        </Section>

        <Section title="Help">
          <Row title="Show the walkthrough" detail="The short tour of the dashboard.">
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate(`/dashboard?user=${user.id}`, { state: { tour: true } })}
            >
              Start
            </Button>
          </Row>
        </Section>

        <Section title="Backup">
          <p className="field-note settings-note">
            {isDesktop
              ? "Everything lives in this app, separately from the website. Import a backup exported from the website to bring your history here."
              : "Everything lives in this browser. Export a backup to keep a copy, or to move your history to the desktop app or another device."}
          </p>
          <Row title="Export" detail={`Every profile in ${HERE} · ${logs.length} ${logs.length === 1 ? "entry" : "entries"} for ${user.name}`}>
            <Button variant="secondary" size="small" onClick={exportData}>
              Export
            </Button>
          </Row>
          <Row title="Import" detail="Adds what's missing. Nothing already here is overwritten.">
            <Button variant="secondary" size="small" onClick={() => fileRef.current?.click()}>
              Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden="true"
              onChange={importData}
            />
          </Row>
        </Section>

        <Section title="Delete profile" className="danger-card">
          <Row title={`Delete ${user.name}`} detail={`Removes this profile and its history from ${HERE}. Other profiles are untouched.`}>
            <button type="button" className="row-danger" onClick={() => setDeleting(true)}>
              Delete…
            </button>
          </Row>
        </Section>
      </motion.div>

      <ConfirmDialog
        open={deleting}
        tone="danger"
        title={`Delete ${user.name}?`}
        body={`This permanently removes ${user.name}'s profile and ${logs.length} logged ${logs.length === 1 ? "entry" : "entries"} from ${HERE}. It can't be undone — export a backup first if you might want them back.`}
        confirmText={user.name}
        confirmLabel="Delete profile"
        onConfirm={removeProfile}
        onCancel={() => setDeleting(false)}
      />
    </motion.main>
  );
}
