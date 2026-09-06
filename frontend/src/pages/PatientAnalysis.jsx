import { useRef, useState } from "react";
import {
  ClipboardPlus,
  ArrowRight,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import { api } from "../services/api";
import { samplePatient, metrics, symptomOptions } from "../data/sampleData";
import {
  PageHeading,
  ErrorNotice,
  Loading,
  Disclaimer,
  HealthScore,
} from "../components/UI";
import VitalCard from "../components/VitalCard";
import History from "../components/History";
const fields = [
  ["heart_rate", "Heart Rate", "BPM", 20, 250, 1],
  ["systolic_bp", "Systolic Blood Pressure", "mmHg", 50, 250, 1],
  ["diastolic_bp", "Diastolic Blood Pressure", "mmHg", 30, 160, 1],
  ["spo2", "SpO₂", "%", 50, 100, 0.1],
  ["temperature", "Body Temperature", "°F", 85, 115, 0.1],
  ["glucose", "Blood Glucose", "mg/dL", 20, 600, 1],
];
export default function PatientAnalysis() {
  const [form, setForm] = useState({
      ...samplePatient,
      name: "",
      age: "",
      gender: "",
    }),
    [result, setResult] = useState(null),
    [submitted, setSubmitted] = useState(null),
    [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    [saveError, setSaveError] = useState(""),
    [refresh, setRefresh] = useState(0);
  const output = useRef(null);
  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
    setResult(null);
    setSaved(false);
    setError("");
  };
  async function analyze(event) {
    event?.preventDefault();
    setError("");
    setBusy(true);
    setResult(null);
    setSaved(false);
    setSaveError("");
    try {
      const patient = {
        ...form,
        name: form.name.trim(),
        age: Number(form.age),
      };
      fields.forEach(([key]) => (patient[key] = Number(form[key])));
      if (!patient.name) throw new Error("Please enter a patient name.");
      if (patient.systolic_bp <= patient.diastolic_bp)
        throw new Error(
          "Systolic blood pressure must be greater than diastolic pressure.",
        );
      const data = await api.analyze(patient);
      setSubmitted(patient);
      setResult(data);
      requestAnimationFrame(() =>
        output.current?.scrollIntoView({ behavior: "instant", block: "start" }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      await api.save(submitted);
      setSaved(true);
      setRefresh((value) => value + 1);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page-stack analysis-page">
      <PageHeading
        title="A clearer picture of health."
        description="Patient analysis. Five vital checks, one understandable assessment."
        action={
          <span className="subtle-tag">
            <ClipboardPlus size={15} /> Rule-based analysis
          </span>
        }
      />
      <div className="analysis-workspace">
        <aside className="intake-guide">
          <span className="intake-symbol">
            <ClipboardPlus size={30} strokeWidth={1.4} />
          </span>
          <h2>
            Every detail
            <br />
            has a purpose.
          </h2>
          <p>
            Begin with the patient, add their vitals, and let each signal tell
            its part of the story.
          </p>
          <nav aria-label="Form sections">
            <a href="#patient-info">
              <span>01</span>Patient information
              <small>
                {[form.name, form.age, form.gender].filter(Boolean).length}/3
              </small>
            </a>
            <a href="#vital-signs">
              <span>02</span>Vital signs<small>6 values</small>
            </a>
            <a href="#symptoms">
              <span>03</span>Symptoms<small>Optional</small>
            </a>
          </nav>
          <div className="intake-foot">
            <strong>Your data stays local.</strong>
            <p>
              Records are written to this project’s SQLite database only when
              you choose Save Analysis.
            </p>
          </div>
        </aside>
        <form className="panel analysis-form" onSubmit={analyze}>
          <div className="section-heading">
            <div>
              <h2 id="patient-info">Patient information</h2>
              <p>Use sample data for a quick classroom demonstration.</p>
            </div>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => {
                setForm({ ...samplePatient });
                setResult(null);
                setError("");
              }}
            >
              <RotateCcw size={15} />
              Use sample data
            </button>
          </div>
          <fieldset disabled={busy}>
            <legend className="sr-only">Patient information</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Enter patient name"
                  required
                  maxLength={100}
                  autoComplete="off"
                />
              </label>
              <label>
                Age
                <input
                  name="age"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="Years"
                  type="number"
                  min="1"
                  max="120"
                  required
                />
              </label>
              <label>
                Gender
                <select
                  name="gender"
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  {["Female", "Male", "Other", "Prefer not to say"].map(
                    (gender) => (
                      <option key={gender}>{gender}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <div className="form-section">
              <h2 id="vital-signs">Vital signs</h2>
              <p>
                All values are required. Glucose uses a simplified fasting
                reference.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {fields.map(([key, label, unit, min, max, step]) => (
                  <label key={key}>
                    {label}
                    <div className="input-unit">
                      <input
                        name={key}
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        required
                      />
                      <span>{unit}</span>
                    </div>
                    <small>
                      Accepted input: {min}–{max} {unit}
                    </small>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-section">
              <h2 id="symptoms">Reported symptoms</h2>
              <p>
                Select any that apply. These are recorded separately from vital
                scores.
              </p>
              <div className="symptom-grid">
                {symptomOptions.map((symptom) => (
                  <label className="checkbox-label" key={symptom}>
                    <input
                      type="checkbox"
                      checked={form.symptoms.includes(symptom)}
                      onChange={(e) =>
                        update(
                          "symptoms",
                          e.target.checked
                            ? [...form.symptoms, symptom]
                            : form.symptoms.filter((s) => s !== symptom),
                        )
                      }
                    />
                    {symptom}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
          {error && <ErrorNotice message={error} retry={analyze} />}
          <div className="form-footer">
            <p>
              <span className="status-dot" /> Five independent checks · No
              artificial delay
            </p>
            <button className="button" type="submit" disabled={busy}>
              {busy ? (
                <Loading text="Analyzing health…" />
              ) : (
                <>
                  Analyze Health <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {result && (
        <section
          ref={output}
          className="analysis-output page-stack"
          aria-live="polite"
        >
          <div className="section-heading">
            <div>
              <h2>Analysis for {submitted.name}</h2>
              <p>Educational results based on the submitted values</p>
            </div>
            <button
              className="button"
              onClick={save}
              disabled={saving || saved}
            >
              {saving ? (
                <Loading text="Saving…" />
              ) : saved ? (
                <>
                  <Check size={17} />
                  Analysis saved
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Analysis
                </>
              )}
            </button>
          </div>
          <div className="panel">
            <HealthScore score={result.health_score} risk={result.risk_level} />
            <p className="symptom-note">
              {result.symptom_note}
              {submitted.symptoms.length > 0 &&
                ` Reported: ${submitted.symptoms.join(", ")}.`}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <VitalCard
                key={metric.key}
                metric={metric}
                {...result.results[metric.key]}
              />
            ))}
          </div>
          {saveError && <ErrorNotice message={saveError} retry={save} />}
        </section>
      )}
      <Disclaimer />
      <History refresh={refresh} />
    </div>
  );
}
