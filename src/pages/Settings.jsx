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
import { Button, Field, PageHeader, Segmented, Switch, AppWindow } from "../components/primitives.jsx";
import { useCoachEnabled, useExerciseLog, useRestSeconds, useUnit, useUser } from "../hooks/useStore.js";
import { useTheme } from "../hooks/useTheme.js";
import { deleteUser, exportBackup, importBackup } from "../lib/store.js";
import { fromProfileDraft, toProfileDraft, validateProfile } from "../lib/profile.js";
import { UNITS } from "../lib/units.js";
import { listItemVariants, listVariants, pageVariants } from "../lib/motionVariants.js";
import { downloadUpdate, isAndroidApp, isIOS, isNativeApp, shareFileAndroid } from "../lib/platform.js";
import { APP_VERSION } from "../lib/site.js";
import { useUpdateCheck } from "../hooks/useUpdate.js";

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

// Desktop app only. Shows what the check at launch found and checks again on
// request; Download appears only once there's something to download.
function UpdateRow() {
  const { status, checking, check } = useUpdateCheck();
  let detail = `Version ${APP_VERSION}`;
  if (checking) detail = "Checking…";
  else if (status?.failed) detail = "Check failed";
  else if (status?.available) detail = `${status.latest} available`;
  else if (status) detail = `Up to date (${status.current})`;

  return (
    <Row title="Updates" detail={detail}>
      {status?.available && !checking ? (
        <Button size="small" onClick={downloadUpdate}>
          Download
        </Button>
      ) : (
        <Button variant="secondary" size="small" onClick={check} disabled={checking}>
          Check now
        </Button>
      )}
    </Row>
  );
}

// Typed values are held as a draft and saved on blur or Enter; the − / +
// buttons save straight away. Saving on every keystroke clamped each digit as
// it landed, so typing 120 went 1 → 15 → 152 → 600.
function RestField({ seconds, onSave }) {
  const [draft, setDraft] = useState(String(seconds));
  const [last, setLast] = useState(seconds);
  if (seconds !== last) {
    setLast(seconds);
    setDraft(String(seconds));
  }
  const commit = () => setDraft(String(onSave(Number(draft) || seconds)));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        commit();
      }}
    >
      <NumberStepper
        value={draft}
        onChange={(next, source) => {
          setDraft(next);
          if (source === "step") onSave(Number(next));
        }}
        onBlur={commit}
        step={15}
        min={15}
        max={600}
        label="Rest timer, seconds"
      />
    </form>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <motion.div variants={listItemVariants}>
      <AppWindow title={title} className={className}>
        {children}
      </AppWindow>
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

  async function exportData() {
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `tsyoku-naru-backup-${stamp}.json`;
    const text = JSON.stringify(exportBackup(), null, 2);
    // Android's WebView can't download, so the app shares the file instead.
    if (isAndroidApp) {
      try {
        if (await shareFileAndroid(name, text)) toast.show({ title: "Backup exported" });
      } catch {
        toast.show({ title: "Export failed" });
      }
      return;
    }
    // On iPhone and iPad the share sheet is the native way to hand a file off
    // (Save to Files, AirDrop, Mail), and it's the same inside a Home Screen
    // app. Everywhere else it downloads, as before.
    if (isIOS) {
      const file = new File([text], name, { type: "application/json" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          toast.show({ title: "Backup exported" });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
          // Refused for some other reason: fall back to a download.
        }
      }
    }
    download(name, text);
    toast.show({ title: "Backup downloaded" });
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
      if (result.food) parts.push(`${result.food} ${result.food === 1 ? "food" : "foods"}`);
      toast.show({
        title: parts.length ? `Imported ${parts.join(", ")}` : "Nothing new to import",
        body: result.skipped
          ? `${result.skipped} skipped`
          : undefined,
      });
    } catch (error) {
      toast.show({
        title: "Import failed",
        body: error instanceof SyntaxError ? "Not a backup file." : error.message,
      });
    }
  }

  function removeProfile() {
    deleteUser(user.id);
    setDeleting(false);
    toast.show({ title: `Deleted ${user.name}` });
    navigate("/welcome", { replace: true });
  }

  return (
    <motion.main className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <PageHeader title="Settings" />

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
          <Row title="Units">
            <Segmented size="small" label="Weight unit" options={UNITS} value={unit} onChange={setUnit} />
          </Row>
          <Row title="Rest timer">
            <span className="settings-stepper">
              <RestField seconds={restSeconds} onSave={setRestSeconds} />
            </span>
          </Row>
          <Row title="Naru">
            <Switch checked={coachEnabled} onChange={setCoachEnabled} label="Show Naru" />
          </Row>
          <Row title="Theme">
            <Segmented size="small" label="Theme" options={THEMES} value={preference} onChange={(next) => setPreference(next)} />
          </Row>
        </Section>

        <Section title="Help">
          <Row title="Show the walkthrough">
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate(`/dashboard?user=${user.id}`, { state: { tour: true } })}
            >
              Start
            </Button>
          </Row>
          {isNativeApp && <UpdateRow />}
        </Section>

        <Section title="Backup">
                    <Row title="Export">
            <Button variant="secondary" size="small" onClick={exportData}>
              Export
            </Button>
          </Row>
          <Row title="Import">
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
          <Row title={`Delete ${user.name}`}>
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
        body={`${logs.length} ${logs.length === 1 ? "entry" : "entries"} will be deleted.`}
        confirmText={user.name}
        confirmLabel="Delete profile"
        onConfirm={removeProfile}
        onCancel={() => setDeleting(false)}
      />
    </motion.main>
  );
}
