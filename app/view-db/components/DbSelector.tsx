"use client";

import type { DbProfile, DbProfileInfo } from "@/lib/view-db/types";
import styles from "../view-db.module.css";

type Props = {
  profiles: DbProfileInfo[];
  value: DbProfile;
  onChange: (db: DbProfile) => void;
};

export function DbSelector({ profiles, value, onChange }: Props) {
  return (
    <div className={styles.dbSelector} role="radiogroup" aria-label="База данных">
      {profiles.map((profile) => (
        <label
          key={profile.id}
          className={
            value === profile.id ? styles.dbOptionActive : styles.dbOption
          }
        >
          <input
            type="radio"
            name="db"
            value={profile.id}
            checked={value === profile.id}
            disabled={!profile.available}
            onChange={() => onChange(profile.id)}
          />
          <span>
            <strong>{profile.label}</strong>
            {!profile.available && profile.hint ? (
              <em className={styles.hint}> — {profile.hint}</em>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}
