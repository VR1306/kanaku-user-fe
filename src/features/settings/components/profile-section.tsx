"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { Form, FormInput } from "@/components/ui/form";
import { COUNTRY_CODES, splitPhone } from "@/constants/settings";
import { Field } from "@/components/ui/field";
import { FOCUS_FIELD } from "@/constants/styles";
import { cn } from "@/utils/cn";
import { AvatarCropper } from "./avatar-cropper";
import { useZodForm } from "@/hooks/use-zod-form";
import { removeAvatar, saveProfile, uploadAvatar } from "../api";
import {
  profileFormSchema,
  toProfileInput,
  type ProfileFormValues,
  type SettingsData,
} from "../schemas";
import { SectionShell } from "./section-shell";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/** Dial-code picker next to the phone number. */
function PhoneField() {
  const { register, formState } = useFormContext<ProfileFormValues>();
  const error = formState.errors.phoneNumber?.message;
  return (
    <Field id="profile-phone" label="Phone" error={error}>
      <div className="flex gap-2">
        <select
          aria-label="Country code"
          {...register("countryCode")}
          className={cn(
            "h-[54px] w-[132px] shrink-0 rounded-control border border-line-strong bg-surface px-3 text-[15px] text-ink",
            FOCUS_FIELD,
          )}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.name}
            </option>
          ))}
        </select>
        <input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          aria-invalid={error ? true : undefined}
          {...register("phoneNumber")}
          className={cn(
            "h-[54px] min-w-0 flex-1 rounded-control border bg-surface px-4 text-[15px] text-ink placeholder:text-subtle",
            error ? "border-danger" : "border-line-strong",
            FOCUS_FIELD,
          )}
        />
      </div>
    </Field>
  );
}

export function ProfileSection({ data, onSaved }: { data: SettingsData; onSaved: () => void }) {
  const router = useRouter();
  const { profile } = data;
  const { countryCode, phoneNumber } = splitPhone(profile.phone);
  const form = useZodForm(profileFormSchema, {
    name: profile.name,
    countryCode,
    phoneNumber,
    monthlyIncome: profile.monthlyIncome ? String(profile.monthlyIncome) : "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function save(values: ProfileFormValues) {
    setSaving(true);
    setStatus(null);
    try {
      await saveProfile(toProfileInput(values));
      setStatus({ tone: "success", text: "Saved" });
      onSaved();
      router.refresh(); // the sidebar shows the name
    } catch (e) {
      setStatus({ tone: "danger", text: e instanceof Error ? e.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  }

  function pickPhoto(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "danger", text: "Choose an image file (JPEG, PNG or WebP)." });
      return;
    }
    setStatus(null);
    setCropFile(file);
  }

  async function savePhoto(dataUrl: string) {
    await uploadAvatar(dataUrl);
    onSaved();
    router.refresh();
  }

  async function dropPhoto() {
    setPhotoBusy(true);
    try {
      await removeAvatar();
      onSaved();
      router.refresh();
    } catch (e) {
      setStatus({
        tone: "danger",
        text: e instanceof Error ? e.message : "Couldn't remove the photo.",
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <SectionShell title="Profile" formId="profile-form" saving={saving} status={status}>
      <div className="flex flex-wrap items-center gap-6">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small data URL from our own database
          <img
            src={profile.avatar}
            alt=""
            className="size-[90px] rounded-full object-cover ring-[3px] ring-accent"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-[90px] place-items-center rounded-full bg-brand font-display text-[32px] font-bold text-accent ring-[3px] ring-accent"
          >
            {initials(profile.name)}
          </span>
        )}
        <div className="flex items-center gap-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Choose a profile photo"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => fileRef.current?.click()}
            className="h-11 rounded-[12px] border border-line-strong bg-surface px-5 text-base font-semibold text-link transition-colors hover:bg-page disabled:opacity-60"
          >
            {profile.avatar ? "Change photo" : "Upload photo"}
          </button>
          {profile.avatar ? (
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => void dropPhoto()}
              className="text-base font-semibold text-danger hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <Form
        form={form}
        onSubmit={save}
        id="profile-form"
        className="mt-8 grid gap-6 sm:grid-cols-2"
      >
        <FormInput
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="e.g. Priya Sharma"
        />
        <div>
          <label htmlFor="settings-email" className="mb-2 block text-sm font-bold text-ink">
            Email
          </label>
          <input
            id="settings-email"
            value={profile.email}
            readOnly
            disabled
            aria-describedby="settings-email-hint"
            className="h-[54px] w-full rounded-control border border-line-strong bg-page px-4 text-[15px] text-muted"
          />
          <p id="settings-email-hint" className="mt-2 text-xs text-muted">
            Your sign-in email can&apos;t be changed here.
          </p>
        </div>
        <PhoneField />
        <FormInput
          name="monthlyIncome"
          label="Monthly income"
          inputMode="decimal"
          placeholder="e.g. 85,000"
          autoComplete="off"
          hint="Used for savings figures when you haven't logged income yet."
        />
      </Form>
      <AvatarCropper file={cropFile} onSave={savePhoto} onClose={() => setCropFile(null)} />
    </SectionShell>
  );
}
