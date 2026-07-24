import { Suspense } from "react";
import ViewDbTableClient from "./table-client";
import styles from "../view-db.module.css";

type Props = {
  params: Promise<{ table: string }>;
};

export default function ViewDbTablePage(props: Props) {
  return (
    <Suspense fallback={<main className={styles.main}>Загрузка…</main>}>
      <ViewDbTableClient {...props} />
    </Suspense>
  );
}
