import type { Metadata } from "next";
import { ErrorNotice } from "@/components/blocks";
import { api, type NamespacePage } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Your finances",
  description: "Your own accounts through CoinPay, private to you. Not available yet.",
  alternates: { canonical: "/finance" },
};

export default async function FinancePage() {
  const ns = await api<NamespacePage>("/finance", undefined, 3600);
  return (
    <>
      <h1>Your finances</h1>
      <p className="lede">{ns.ok ? ns.data.description : "Your own accounts through CoinPay, private to you."}</p>
      {!ns.ok && <ErrorNotice error={ns.error} />}
      <div className="notice warn">
        <p><strong>Not available yet.</strong> {ns.ok ? ns.data.note : "No finance data is reachable here."}</p>
      </div>
      <h2>How it will work</h2>
      <ul className="notes">
        <li>You connect your own CoinPay account. Datamart never asks for a bank password or an MFA code.</li>
        <li>Connected institutions, transactions and reports are visible only to you, never on a public page or a shareable link.</li>
        <li>Datamart does not move money. Any payment needs your explicit approval in CoinPay.</li>
      </ul>
    </>
  );
}
