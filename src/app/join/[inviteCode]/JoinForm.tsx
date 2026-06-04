"use client";

import { useFormState, useFormStatus } from "react-dom";
import { joinTeam, type JoinState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? "Joining…" : "Join team"}
    </button>
  );
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string>;
  name: string;
}) {
  const msg = errors?.[name];
  if (!msg) return null;
  return <p className="mt-1 text-sm text-rose-600">{msg}</p>;
}

export function JoinForm({
  inviteCode,
  teamName,
}: {
  inviteCode: string;
  teamName: string;
}) {
  const [state, formAction] = useFormState<JoinState, FormData>(joinTeam, {});
  const fe = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="inviteCode" value={inviteCode} />

      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Player
        </h2>
        <div>
          <label className="label" htmlFor="player_first_name">
            First name <span className="text-rose-500">*</span>
          </label>
          <input
            id="player_first_name"
            name="player_first_name"
            className="input"
            autoComplete="given-name"
          />
          <FieldError errors={fe} name="player_first_name" />
        </div>
        <div>
          <label className="label" htmlFor="player_last_name">
            Last name <span className="text-rose-500">*</span>
          </label>
          <input
            id="player_last_name"
            name="player_last_name"
            className="input"
            autoComplete="family-name"
          />
          <FieldError errors={fe} name="player_last_name" />
        </div>
        <div>
          <label className="label" htmlFor="jersey_number">
            Jersey number
          </label>
          <input
            id="jersey_number"
            name="jersey_number"
            className="input"
            inputMode="numeric"
          />
          <FieldError errors={fe} name="jersey_number" />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Guardian 1 (primary)
        </h2>
        <div>
          <label className="label" htmlFor="g1_name">
            Name <span className="text-rose-500">*</span>
          </label>
          <input id="g1_name" name="g1_name" className="input" autoComplete="name" />
          <FieldError errors={fe} name="g1_name" />
        </div>
        <div>
          <label className="label" htmlFor="g1_phone">
            Phone
          </label>
          <input
            id="g1_phone"
            name="g1_phone"
            className="input"
            type="tel"
            autoComplete="tel"
          />
          <FieldError errors={fe} name="g1_phone" />
        </div>
        <div>
          <label className="label" htmlFor="g1_email">
            Email
          </label>
          <input
            id="g1_email"
            name="g1_email"
            className="input"
            type="email"
            autoComplete="email"
          />
          <FieldError errors={fe} name="g1_email" />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Guardian 2 (optional)
        </h2>
        <div>
          <label className="label" htmlFor="g2_name">
            Name
          </label>
          <input id="g2_name" name="g2_name" className="input" />
          <FieldError errors={fe} name="g2_name" />
        </div>
        <div>
          <label className="label" htmlFor="g2_phone">
            Phone
          </label>
          <input id="g2_phone" name="g2_phone" className="input" type="tel" />
          <FieldError errors={fe} name="g2_phone" />
        </div>
        <div>
          <label className="label" htmlFor="g2_email">
            Email
          </label>
          <input id="g2_email" name="g2_email" className="input" type="email" />
          <FieldError errors={fe} name="g2_email" />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Safety
        </h2>
        <div>
          <label className="label" htmlFor="allergies">
            Allergies
          </label>
          <textarea id="allergies" name="allergies" className="input" rows={2} />
          <FieldError errors={fe} name="allergies" />
        </div>
        <div>
          <label className="label" htmlFor="medical_notes">
            Medical notes
          </label>
          <textarea
            id="medical_notes"
            name="medical_notes"
            className="input"
            rows={2}
          />
          <FieldError errors={fe} name="medical_notes" />
        </div>
        <div>
          <label className="label" htmlFor="emergency_contact_name">
            Emergency contact name
          </label>
          <input
            id="emergency_contact_name"
            name="emergency_contact_name"
            className="input"
          />
          <FieldError errors={fe} name="emergency_contact_name" />
        </div>
        <div>
          <label className="label" htmlFor="emergency_contact_phone">
            Emergency contact phone
          </label>
          <input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            className="input"
            type="tel"
          />
          <FieldError errors={fe} name="emergency_contact_phone" />
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Consent
        </h2>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="consent_comms"
            value="on"
            className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
          />
          <span>
            I agree to receive team communication about games, practices and team
            logistics.
          </span>
        </label>
        <FieldError errors={fe} name="consent_comms" />
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="consent_accurate"
            value="on"
            className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
          />
          <span>I confirm this information is accurate.</span>
        </label>
        <FieldError errors={fe} name="consent_accurate" />
      </section>

      <SubmitButton />
      <p className="text-center text-xs text-slate-400">Joining {teamName}</p>
    </form>
  );
}
